const { Bot, InputFile } = require("grammy");
const { Readable } = require("stream");
const path = require("path");
const fs = require("fs");
const mm = require("music-metadata");
const sharp = require("sharp");
const { processChannelPost } = require("./channelScanner");
const metadataService = require("../services/metadataService");
const audioCache = require("../cache/audioCache");
const { getDatabase } = require("../db/database");

let botInstance = null;
let pollingStarted = false;
let activeScans = 0;
const MAX_CONCURRENT_SCANS = 2;
const scanQueue = [];

function enqueueScan(fn) {
    return new Promise((resolve, reject) => {
        const run = async () => {
            activeScans++;
            try {
                resolve(await fn());
            } catch (err) {
                reject(err);
            } finally {
                activeScans--;
                if (scanQueue.length > 0 && activeScans < MAX_CONCURRENT_SCANS) {
                    scanQueue.shift()();
                }
            }
        };
        if (activeScans < MAX_CONCURRENT_SCANS) {
            run();
        } else {
            scanQueue.push(run);
        }
    });
}

function getBot() {
    if (botInstance) return botInstance;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
    botInstance = new Bot(token);

    botInstance.on("channel_post", (ctx) => {
        console.log(`[Bot] channel_post received in chat ${ctx.chat?.id}`);
        enqueueScan(() => processChannelPost(ctx, botInstance)).catch((err) => {
            console.error("[Bot] channel_post handler error:", err.message);
        });
    });
    
    botInstance.command("start", (ctx) => {
        ctx.reply(
            "Welcome to BinksConnect!\n\n" +
            "I manage your music storage on Telegram. Send /help to see what I can do."
        );
    });

    botInstance.command("help", (ctx) => {
        ctx.reply(
            "BinksConnect Bot Commands\n\n" +
            "/start - Welcome message\n" +
            "/help - Show this list\n" +
            "/status - Library and cache stats\n" +
            "/rescan - Re-extract artwork from cached audio files\n" +
            "/addchannel <id> - Register a storage channel (sudo only)\n" +
            "/removechannel <id> - Deactivate a channel (sudo only)\n" +
            "/channels - List registered channels\n" +
            "/delete <query> - Search and delete tracks (sudo only)\n\n" +
            "Inline: Type @botname <query> in any chat to search your library."
        );
    });

    botInstance.command("addchannel", (ctx) => {
        const userId = String(ctx.from?.id);
        const sudoId = String(process.env.SUDO_USER_ID || "");
        if (!sudoId || userId !== sudoId) {
            ctx.reply("Only the sudo user can manage channels.");
            return;
        }

        const channelId = ctx.match?.trim();
        if (!channelId) {
            ctx.reply("Usage: /addchannel <channel_id>\n\nExample: /addchannel -1001234567890\n\nYou can get the channel ID by forwarding a message from the channel to @userinfobot or @getidsbot.");
            return;
        }

        try {
            const db = getDatabase();
            const existing = db.prepare("SELECT channel_id FROM telegram_channels WHERE channel_id = ?").get(channelId);
            if (existing) {
                ctx.reply(`Channel ${channelId} is already registered.`);
                return;
            }

            db.prepare("INSERT INTO telegram_channels (channel_id, title) VALUES (?, ?)").run(channelId, channelId);
            ctx.reply(`Channel ${channelId} registered.\n\nMake sure the bot is added as an admin to this channel. New audio files will be indexed automatically.`);
        } catch (err) {
            ctx.reply("Failed to register channel: " + err.message);
        }
    });

    botInstance.command("removechannel", (ctx) => {
        const userId = String(ctx.from?.id);
        const sudoId = String(process.env.SUDO_USER_ID || "");
        if (!sudoId || userId !== sudoId) {
            ctx.reply("Only the sudo user can manage channels.");
            return;
        }

        const channelId = ctx.match?.trim();
        if (!channelId) {
            ctx.reply("Usage: /removechannel <channel_id>");
            return;
        }

        try {
            const db = getDatabase();
            const result = db.prepare("DELETE FROM telegram_channels WHERE channel_id = ?").run(channelId);
            if (result.changes === 0) {
                ctx.reply(`Channel ${channelId} not found.`);
                return;
            }
            ctx.reply(`Channel ${channelId} removed.`);
        } catch (err) {
            ctx.reply("Failed to remove channel: " + err.message);
        }
    });

    botInstance.command("channels", (ctx) => {
        try {
            const db = getDatabase();
            const channels = db.prepare("SELECT channel_id, title, is_active, strategy FROM telegram_channels ORDER BY created_at ASC").all();
            if (channels.length === 0) {
                ctx.reply("No channels registered.\n\nUse /addchannel <channel_id> to add one.");
                return;
            }

            const list = channels.map((c, i) =>
                `${i + 1}. ${c.channel_id} (${c.is_active ? "active" : "inactive"}) [${c.strategy}]`
            ).join("\n");
            ctx.reply(`Registered channels:\n\n${list}`);
        } catch (err) {
            ctx.reply("Failed to list channels: " + err.message);
        }
    });

    botInstance.command("status", (ctx) => {
        try {
            const db = getDatabase();
            const tracks = db.prepare("SELECT COUNT(*) as c FROM tracks").get().c;
            const albums = db.prepare("SELECT COUNT(*) as c FROM albums").get().c;
            const artists = db.prepare("SELECT COUNT(*) as c FROM artists").get().c;
            const channels = db.prepare("SELECT COUNT(*) as c FROM telegram_channels WHERE is_active = 1").get().c;
            const cache = audioCache.getCacheStats();

            ctx.reply(
                "BinksConnect Status\n\n" +
                `Tracks: ${tracks}\n` +
                `Albums: ${albums}\n` +
                `Artists: ${artists}\n` +
                `Active channels: ${channels}\n\n` +
                `Cache: ${cache.entries} files (${cache.totalMB}MB / ${cache.maxMB}MB)`
            );
        } catch (err) {
            ctx.reply("Failed to get status: " + err.message);
        }
    });

    botInstance.command("rescan", async (ctx) => {
        await ctx.reply("Starting rescan... This may take a while.");

        try {
            const db = getDatabase();
            const mappings = db.prepare(`
                SELECT pm.checksum, pm.file_name, t.internal_id as track_id, t.title
                FROM provider_mappings pm
                JOIN tracks t ON t.id = pm.track_id
                WHERE pm.provider = 'telegram' AND pm.checksum IS NOT NULL
            `).all();

            let extracted = 0;
            let skipped = 0;
            let failed = 0;
            let notCached = 0;

            for (const mapping of mappings) {
                const cached = audioCache.getCachedStream(mapping.checksum);
                if (!cached) {
                    notCached++;
                    continue;
                }

                const cachePath = cached.stream.path;
                cached.stream.destroy();

                try {
                    const parsed = await mm.parseFile(cachePath);
                    const picture = parsed.common?.picture?.[0];
                    if (!picture || !picture.data) {
                        skipped++;
                        continue;
                    }

                    const inputBuffer = Buffer.from(picture.data);
                    const fullSize = await sharp(inputBuffer).jpeg({ quality: 90 }).toBuffer();
                    const thumbnail = await sharp(inputBuffer).resize(300, 300, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
                    const mime = picture.format || "image/jpeg";

                    const track = db.prepare("SELECT album_id, artist_id FROM tracks WHERE internal_id = ?").get(mapping.track_id);
                    if (!track) { failed++; continue; }

                    if (track.album_id) {
                        metadataService.storeAlbumCover(track.album_id, thumbnail, fullSize, mime);
                    }
                    if (track.artist_id) {
                        metadataService.storeArtistCover(track.artist_id, thumbnail, fullSize, mime);
                    }
                    extracted++;
                } catch {
                    failed++;
                }
            }

            ctx.reply(
                "Rescan complete\n\n" +
                `Total tracks: ${mappings.length}\n` +
                `Art extracted: ${extracted}\n` +
                `Skipped (no art): ${skipped}\n` +
                `Not cached: ${notCached}\n` +
                `Failed: ${failed}`
            );
        } catch (err) {
            ctx.reply("Rescan failed: " + err.message);
        }
    });

    botInstance.on("inline_query", async (ctx) => {
        const rawQuery = ctx.inlineQuery.query?.trim();
        if (!rawQuery) {
            ctx.answerInlineQuery([], { cache_time: 30 });
            return;
        }

        console.log(`[Bot] Inline query: "${rawQuery}" from user ${ctx.from?.id}`);

        const results = metadataService.searchTracks(rawQuery);
        console.log(`[Bot] Found ${results.length} tracks for "${rawQuery}"`);

        const inlineResults = results.map((r, i) => ({
            type: "article",
            id: String(i),
            title: r.title,
            description: r.artist ? `${r.artist}${r.album ? " - " + r.album : ""}` : r.album || "Unknown",
            input_message_content: {
                message_text: `${r.title}${r.artist ? " - " + r.artist : ""}`,
            },
        }));

        ctx.answerInlineQuery(inlineResults, { cache_time: 60 });
    });

    botInstance.command("delete", async (ctx) => {
        const userId = String(ctx.from?.id);
        const sudoId = String(process.env.SUDO_USER_ID || "");
        if (!sudoId || userId !== sudoId) {
            ctx.reply("Only the sudo user can delete tracks.");
            return;
        }

        const query = ctx.match?.trim();
        if (!query) {
            ctx.reply("Usage: /delete <search term>\n\nExample: /delete beatles");
            return;
        }

        const results = metadataService.searchTracks(query);
        if (results.length === 0) {
            ctx.reply(`No tracks found matching "${query}"`);
            return;
        }

        const rows = results.slice(0, 8).map((r) => [
            {
                text: `${r.title}${r.artist ? " - " + r.artist : ""}`,
                callback_data: `del:${r.id}`,
            },
        ]);

        ctx.reply(`Delete tracks matching "${query}":`, {
            reply_markup: {
                inline_keyboard: rows,
            },
        });
    });

    botInstance.on("callback_query:data", async (ctx) => {
        const data = ctx.callbackQuery.data;
        if (!data.startsWith("del:")) return;

        const userId = String(ctx.from?.id);
        const sudoId = String(process.env.SUDO_USER_ID || "");
        if (!sudoId || userId !== sudoId) {
            ctx.answerCallbackQuery({ text: "Not authorized", show_alert: true });
            return;
        }

        const trackId = data.slice(4);
        console.log(`[Bot] Callback delete: track ${trackId} by user ${userId}`);

        try {
            const result = metadataService.deleteTrack(trackId);
            if (!result) {
                ctx.answerCallbackQuery({ text: "Track not found", show_alert: true });
                return;
            }

            let cleaned = 0;
            for (const m of (result.mappings || [])) {
                if (m.provider === "telegram" && m.telegram_channel_id && m.telegram_message_id) {
                    const ok = await deleteMessage(m.telegram_channel_id, m.telegram_message_id);
                    if (ok) cleaned++;
                }
                if (m.checksum) {
                    audioCache.removeChecksum(m.checksum);
                }
            }

            await ctx.editMessageText(`Deleted "${result.title}" (${cleaned} Telegram message(s) removed)`);
            ctx.answerCallbackQuery();
            console.log(`[Bot] Deleted "${result.title}", cleaned ${cleaned} message(s)`);
        } catch (err) {
            console.error(`[Bot] Delete failed:`, err.message);
            ctx.answerCallbackQuery({ text: "Delete failed: " + err.message, show_alert: true });
        }
    });

    botInstance.on("message", (ctx) => {
        console.log(`[Bot] message received from user ${ctx.from?.id}`);
    });

    return botInstance;
}

async function startPolling() {
    if (pollingStarted) return;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.log("[Bot] No TELEGRAM_BOT_TOKEN, skipping long polling");
        return;
    }
    const bot = getBot();
    pollingStarted = true;
    console.log("[Bot] Starting long polling...");
    bot.start({
        onStart: (botInfo) => {
            console.log(`[Bot] Connected as @${botInfo.username}`);
        },
    }).catch((err) => {
        console.error("[Bot] Long polling failed:", err.message);
        pollingStarted = false;
    });
}

async function uploadAudio(filePath, channelId, caption = "") {
    const bot = getBot();
    const fileName = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);

    const result = await bot.api.sendDocument(channelId, new InputFile(fileStream, fileName), {
        caption: caption || fileName,
    });

    const doc = result.document;
    return {
        channelId: String(channelId),
        messageId: result.message_id,
        fileId: doc.file_id,
        fileUniqueId: doc.file_unique_id,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
    };
}

async function downloadFile(fileId) {
    const bot = getBot();
    const file = await bot.api.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Telegram download failed: ${response.status}`);
    return {
        stream: response.body,
        contentType: response.headers.get("content-type") || "application/octet-stream",
        contentLength: response.headers.get("content-length"),
    };
}

async function deleteMessage(channelId, messageId) {
    const bot = getBot();
    try {
        await bot.api.deleteMessage(channelId, messageId);
        return true;
    } catch (err) {
        console.error("Failed to delete Telegram message:", err.message);
        return false;
    }
}

async function getFileInfo(fileId) {
    const bot = getBot();
    const file = await bot.api.getFile(fileId);
    return {
        filePath: file.file_path,
        fileSize: file.file_size,
    };
}

async function health() {
    try {
        const bot = getBot();
        const me = await bot.api.getMe();
        return { ok: true, botUsername: me.username, botId: me.id };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}



module.exports = { getBot, uploadAudio, downloadFile, deleteMessage, getFileInfo, health, startPolling };
