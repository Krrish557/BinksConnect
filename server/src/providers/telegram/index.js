const BaseProvider = require("../base");
const telegramBot = require("../../telegram/bot");
const metadataService = require("../../services/metadataService");
const { createAllocator } = require("../channelAllocator");
const { getDatabase } = require("../../db/database");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");

class TelegramStorageProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this._allocator = null;
    }

    get allocator() {
        if (!this._allocator) {
            const strategy = process.env.TELEGRAM_ALLOCATOR_STRATEGY || "round_robin";
            this._allocator = createAllocator(strategy);
        }
        return this._allocator;
    }

    get tmpDir() {
        const dir = path.join(os.tmpdir(), "binksconnect");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    async upload(filePath, uploadedBy = "admin") {
        const fileBuffer = fs.readFileSync(filePath);
        const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        const existing = metadataService.findTrackByChecksum(checksum);
        if (existing) {
            return { success: true, trackId: existing.id, duplicate: true };
        }

        const channelId = this.allocator.allocate();
        const result = await telegramBot.uploadAudio(filePath, channelId);

        return {
            success: true,
            channelId: result.channelId,
            messageId: result.messageId,
            fileId: result.fileId,
            fileUniqueId: result.fileUniqueId,
            fileName: result.fileName,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            checksum,
            uploadedBy,
        };
    }

    async download(trackInternalId) {
        const mappings = metadataService.findMappingByTrackId(trackInternalId);
        const mapping = mappings.find((m) => m.provider === "telegram");
        if (!mapping) throw new Error(`No Telegram mapping found for track: ${trackInternalId}`);

        const cachePath = path.join(this.tmpDir, `${mapping.checksum || mapping.telegram_file_unique_id}.audio`);
        if (fs.existsSync(cachePath)) {
            const stat = fs.statSync(cachePath);
            return {
                stream: fs.createReadStream(cachePath),
                status: 200,
                contentType: mapping.mime_type || "audio/mpeg",
                contentLength: String(stat.size),
                contentRange: null,
            };
        }

        const result = await telegramBot.downloadFile(mapping.telegram_file_id);
        const nodeStream = require("stream").Readable.fromWeb(result.stream);
        const writeStream = fs.createWriteStream(cachePath);
        nodeStream.pipe(writeStream);

        await new Promise((resolve, reject) => {
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
        });

        const stat = fs.statSync(cachePath);
        return {
            stream: fs.createReadStream(cachePath),
            status: 200,
            contentType: mapping.mime_type || "audio/mpeg",
            contentLength: String(stat.size),
            contentRange: null,
        };
    }

    async delete(trackInternalId) {
        const mappings = metadataService.findMappingByTrackId(trackInternalId);
        for (const mapping of mappings) {
            if (mapping.provider === "telegram" && mapping.telegram_channel_id && mapping.telegram_message_id) {
                await telegramBot.deleteMessage(mapping.telegram_channel_id, mapping.telegram_message_id);
            }
        }
        return true;
    }

    async exists(trackInternalId) {
        const mappings = metadataService.findMappingByTrackId(trackInternalId);
        return mappings.some((m) => m.provider === "telegram");
    }

    async health() {
        return telegramBot.health();
    }

    async verify(trackInternalId) {
        const mappings = metadataService.findMappingByTrackId(trackInternalId);
        const results = [];
        for (const mapping of mappings) {
            if (mapping.provider === "telegram") {
                try {
                    await telegramBot.getFileInfo(mapping.telegram_file_id);
                    results.push({ provider: "telegram", ok: true });
                } catch {
                    results.push({ provider: "telegram", ok: false, error: "File not accessible" });
                }
            }
        }
        return results;
    }
}

module.exports = TelegramStorageProvider;
