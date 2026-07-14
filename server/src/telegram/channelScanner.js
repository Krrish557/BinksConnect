const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const mm = require("music-metadata");
const { scanFile } = require("./scanner");
const metadataService = require("../services/metadataService");
const { getDatabase } = require("../db/database");

const AUDIO_MIME_PREFIXES = ["audio/"];

function isRegisteredChannel(channelId) {
    const db = getDatabase();
    const ch = db.prepare("SELECT * FROM telegram_channels WHERE channel_id = ? AND is_active = 1").get(String(channelId));
    return !!ch;
}

function getTmpDir() {
    const dir = path.join(os.tmpdir(), "binksconnect-scan");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function cleanup(filePath) {
    try { fs.unlinkSync(filePath); } catch {}
}

async function processChannelPost(ctx, bot) {
    const msg = ctx.channelPost;
    console.log(`[Scanner] Raw channel_post keys: ${msg ? Object.keys(msg).join(", ") : "null"}`);
    if (!msg || (!msg.document && !msg.audio)) {
        console.log(`[Scanner] Skipping: no document or audio found`);
        return;
    }

    const chatId = String(msg.chat.id);
    if (!isRegisteredChannel(chatId)) {
        console.log(`[Scanner] Skipping: channel ${chatId} not registered`);
        return;
    }

    const audioInfo = msg.document || msg.audio;
    const mimeType = audioInfo.mime_type || "";
    const fileName = audioInfo.file_name || "unknown";
    const fileId = audioInfo.file_id;
    const fileUniqueId = audioInfo.file_unique_id;
    const fileSize = audioInfo.file_size || 0;
    const messageId = msg.message_id;

    const telegramTitle = msg.audio ? msg.audio.title : null;
    const telegramArtist = msg.audio ? msg.audio.performer : null;

    if (!AUDIO_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) {
        console.log(`[Scanner] Skipping ${fileName}: MIME ${mimeType} is not audio`);
        return;
    }
    if (fileSize > 20 * 1024 * 1024) {
        console.log(`[Scanner] Skipping ${fileName}: exceeds 20MB (${(fileSize / 1024 / 1024).toFixed(1)}MB)`);
        return;
    }

    console.log(`[Scanner] Processing: ${fileName} (${mimeType}, ${(fileSize / 1024 / 1024).toFixed(1)}MB) from channel ${chatId}`);

    const tmpDir = getTmpDir();
    const tmpPath = path.join(tmpDir, `${Date.now()}-${fileName}`);

    try {
        const fileInfo = await bot.api.getFile(fileId);
        const url = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(tmpPath, buffer);

        const scanResult = scanFile(buffer, fileName, mimeType);
        if (!scanResult.valid) {
            console.log(`[Scanner] Rejected ${fileName}: ${scanResult.reason}`);
            cleanup(tmpPath);
            return;
        }

        const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
        const existing = metadataService.findTrackByChecksum(checksum);
        if (existing) {
            console.log(`[Scanner] Skipping ${fileName}: duplicate (checksum match)`);
            cleanup(tmpPath);
            return;
        }

        let metadata;
        try {
            const parsed = await mm.parseFile(tmpPath);
            const common = parsed.common || {};
            const format = parsed.format || {};
            metadata = {
                title: common.title || telegramTitle || path.basename(fileName, path.extname(fileName)),
                artist: common.artist || telegramArtist || null,
                album: common.album || null,
                genre: common.genre ? common.genre[0] : null,
                year: common.year || null,
                trackNumber: common.track ? common.track.no : null,
                duration: format.duration || 0,
                bitrate: format.bitrate ? Math.round(format.bitrate) : null,
            };
        } catch {
            metadata = {
                title: telegramTitle || path.basename(fileName, path.extname(fileName)),
                artist: telegramArtist || null,
                album: null,
                genre: null,
                year: null,
                trackNumber: null,
                duration: 0,
                bitrate: null,
            };
        }

        let artistDbId = null;
        if (metadata.artist) {
            const artist = metadataService.createArtist(metadata.artist);
            artistDbId = artist.dbId;
        }

        let albumDbId = null;
        if (metadata.album) {
            const album = metadataService.createAlbum(metadata.album, artistDbId, metadata.year || 0);
            albumDbId = album.dbId;
        }

        const track = metadataService.createTrack(metadata, albumDbId, artistDbId);

        metadataService.createProviderMapping(track.dbId, "telegram", {
            telegramChannelId: chatId,
            telegramMessageId: messageId,
            telegramFileId: fileId,
            telegramFileUniqueId: fileUniqueId,
            fileName,
            fileSize,
            mimeType,
            checksum,
            uploadedBy: "channel_scan",
        });

        console.log(`[Scanner] Indexed: ${metadata.title} → ${track.id}`);
        cleanup(tmpPath);
    } catch (err) {
        console.error(`[Scanner] Failed to process ${fileName}:`, err.message);
        cleanup(tmpPath);
    }
}

module.exports = { processChannelPost };
