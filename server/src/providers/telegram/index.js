const BaseProvider = require("../base");
const telegramBot = require("../../telegram/bot");
const metadataService = require("../../services/metadataService");
const { createAllocator } = require("../channelAllocator");
const audioCache = require("../../cache/audioCache");
const fs = require("fs");
const { Readable } = require("stream");

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

    async upload(filePath, uploadedBy = "admin") {
        const crypto = require("crypto");
        const fileBuffer = fs.readFileSync(filePath);
        const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        const existing = await metadataService.findTrackByChecksum(checksum);
        if (existing) {
            return { success: true, trackId: existing.id, duplicate: true };
        }

        const channelId = await this.allocator.allocate();
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

    async download(trackInternalId, rangeHeader = null) {
        const mappings = await metadataService.findMappingByTrackId(trackInternalId);
        const mapping = mappings.find((m) => m.provider === "telegram");
        if (!mapping) throw new Error(`No Telegram mapping found for track: ${trackInternalId}`);

        const checksum = mapping.checksum || mapping.telegram_file_unique_id;
        const contentType = mapping.mime_type || "audio/mpeg";

        const cached = await audioCache.getCachedStream(checksum);
        if (cached) {
            return this._serveFromCache(cached, contentType, rangeHeader);
        }

        const result = await telegramBot.downloadFile(mapping.telegram_file_id);
        const webStream = result.stream;

        const chunks = [];
        const reader = webStream.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.from(value));
        }
        const fullBuffer = Buffer.concat(chunks);

        await audioCache.storeToCache(checksum, fullBuffer);

        if (rangeHeader) {
            return this._serveRange(fullBuffer, contentType, rangeHeader);
        }

        return {
            stream: Readable.from(fullBuffer),
            status: 200,
            contentType,
            contentLength: String(fullBuffer.length),
            contentRange: null,
        };
    }

    _serveFromCache(cached, contentType, rangeHeader) {
        if (rangeHeader) {
            return this._serveRangeFromPath(cached, contentType, rangeHeader);
        }
        return {
            stream: cached.stream,
            status: 200,
            contentType,
            contentLength: String(cached.fileSize),
            contentRange: null,
        };
    }

    _serveRangeFromPath(cached, contentType, rangeHeader) {
        const totalSize = cached.fileSize;
        const range = this._parseRange(rangeHeader, totalSize);
        if (!range) {
            return {
                stream: cached.stream,
                status: 200,
                contentType,
                contentLength: String(totalSize),
                contentRange: null,
            };
        }
        const { start, end } = range;
        const chunkSize = end - start + 1;
        const stream = fs.createReadStream(cached.stream.path, { start, end });
        return {
            stream,
            status: 206,
            contentType,
            contentLength: String(chunkSize),
            contentRange: `bytes ${start}-${end}/${totalSize}`,
        };
    }

    _serveRange(buffer, contentType, rangeHeader) {
        const totalSize = buffer.length;
        const range = this._parseRange(rangeHeader, totalSize);
        if (!range) {
            return {
                stream: Readable.from(buffer),
                status: 200,
                contentType,
                contentLength: String(totalSize),
                contentRange: null,
            };
        }
        const { start, end } = range;
        const chunkSize = end - start + 1;
        const chunk = buffer.subarray(start, end + 1);
        return {
            stream: Readable.from(chunk),
            status: 206,
            contentType,
            contentLength: String(chunkSize),
            contentRange: `bytes ${start}-${end}/${totalSize}`,
        };
    }

    _parseRange(rangeHeader, totalSize) {
        if (!rangeHeader || !rangeHeader.startsWith("bytes=")) return null;
        const parts = rangeHeader.slice(6).split("-");
        if (parts.length !== 2) return null;
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        if (isNaN(start) || isNaN(end) || start < 0 || end >= totalSize || start > end) return null;
        return { start, end };
    }

    async delete(trackInternalId) {
        const mappings = await metadataService.findMappingByTrackId(trackInternalId);
        for (const mapping of mappings) {
            if (mapping.provider === "telegram" && mapping.telegram_channel_id && mapping.telegram_message_id) {
                await telegramBot.deleteMessage(mapping.telegram_channel_id, mapping.telegram_message_id);
            }
        }
        return true;
    }

    async exists(trackInternalId) {
        const mappings = await metadataService.findMappingByTrackId(trackInternalId);
        return mappings.some((m) => m.provider === "telegram");
    }

    async health() {
        return telegramBot.health();
    }

    async verify(trackInternalId) {
        const mappings = await metadataService.findMappingByTrackId(trackInternalId);
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
