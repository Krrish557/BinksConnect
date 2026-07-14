const { Bot, InputFile } = require("grammy");
const { Readable } = require("stream");
const path = require("path");
const fs = require("fs");
const { processChannelPost } = require("./channelScanner");

let botInstance = null;
let pollingStarted = false;

function getBot() {
    if (botInstance) return botInstance;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
    botInstance = new Bot(token);

    botInstance.on("channel_post", (ctx) => {
        console.log(`[Bot] channel_post received in chat ${ctx.chat?.id}`);
        processChannelPost(ctx, botInstance).catch((err) => {
            console.error("[Bot] channel_post handler error:", err.message);
        });
    });
    
    botInstance.command("start", (ctx) => {
        ctx.reply("Welcome to BinksConnect! 🎵");
        // Add your welcome message or functionality here
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
