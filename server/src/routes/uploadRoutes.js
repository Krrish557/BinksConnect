const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const mm = require("music-metadata");
const sharp = require("sharp");
const { authMiddleware } = require("../middleware/auth");
const { scanFile } = require("../telegram/scanner");
const metadataService = require("../services/metadataService");
const TelegramStorageProvider = require("../providers/telegram");
const { getDatabase } = require("../db/database");

const router = express.Router();

const upload = multer({
    dest: path.join(require("os").tmpdir(), "binksconnect-uploads"),
    limits: { fileSize: 20 * 1024 * 1024 },
});

router.post("/", authMiddleware, upload.array("files", 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const uploadedBy = req.session.providerConfig?.username || "admin";
        const provider = new TelegramStorageProvider({});
        const results = [];

        for (const file of req.files) {
            try {
                const fileBuffer = fs.readFileSync(file.originalname ? file.path : file.path);
                const scanResult = scanFile(fileBuffer, file.originalname || file.filename, file.mimetype);
                if (!scanResult.valid) {
                    cleanup(file.path);
                    results.push({ fileName: file.originalname || file.filename, success: false, error: scanResult.reason });
                    continue;
                }

                const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");
                const existing = metadataService.findTrackByChecksum(checksum);
                if (existing) {
                    cleanup(file.path);
                    results.push({ fileName: file.originalname || file.filename, success: true, trackId: existing.id, duplicate: true });
                    continue;
                }

                let metadata;
                let picture = null;
                try {
                    const parsed = await mm.parseFile(file.path);
                    const common = parsed.common || {};
                    const format = parsed.format || {};
                    metadata = {
                        title: common.title || path.basename(file.originalname || file.filename, path.extname(file.originalname || file.filename)),
                        artist: common.artist || null,
                        album: common.album || null,
                        genre: common.genre ? common.genre[0] : null,
                        year: common.year || null,
                        trackNumber: common.track ? common.track.no : null,
                        duration: format.duration || 0,
                        bitrate: format.bitrate ? Math.round(format.bitrate) : null,
                    };
                    if (common.picture && common.picture.length > 0) {
                        picture = common.picture[0];
                    }
                } catch {
                    metadata = {
                        title: path.basename(file.originalname || file.filename, path.extname(file.originalname || file.filename)),
                        artist: null,
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

                const uploadResult = await provider.upload(file.path, uploadedBy);
                if (!uploadResult.success) {
                    cleanup(file.path);
                    results.push({ fileName: file.originalname || file.filename, success: false, error: "Telegram upload failed" });
                    continue;
                }

                metadataService.createProviderMapping(track.dbId, "telegram", {
                    telegramChannelId: uploadResult.channelId,
                    telegramMessageId: uploadResult.messageId,
                    telegramFileId: uploadResult.fileId,
                    telegramFileUniqueId: uploadResult.fileUniqueId,
                    fileName: uploadResult.fileName,
                    fileSize: uploadResult.fileSize,
                    mimeType: uploadResult.mimeType,
                    checksum: uploadResult.checksum,
                    uploadedBy: uploadResult.uploadedBy,
                });

                if (picture && picture.data) {
                    try {
                        const inputBuffer = Buffer.from(picture.data);
                        const fullSize = await sharp(inputBuffer).jpeg({ quality: 90 }).toBuffer();
                        const thumbnail = await sharp(inputBuffer).resize(300, 300, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
                        const mime = picture.format || "image/jpeg";
                        if (albumDbId) {
                            metadataService.storeAlbumCover(albumDbId, thumbnail, fullSize, mime);
                        }
                        if (artistDbId) {
                            metadataService.storeArtistCover(artistDbId, thumbnail, fullSize, mime);
                        }
                    } catch (artErr) {
                        console.log(`[Upload] Failed to extract cover art: ${artErr.message}`);
                    }
                }

                cleanup(file.path);
                results.push({
                    fileName: uploadResult.fileName,
                    success: true,
                    trackId: track.id,
                    title: metadata.title,
                    artist: metadata.artist,
                    album: metadata.album,
                    duplicate: false,
                });
            } catch (err) {
                cleanup(file.path);
                results.push({ fileName: file.originalname || file.filename, success: false, error: err.message });
            }
        }

        const successful = results.filter((r) => r.success && !r.duplicate).length;
        const duplicates = results.filter((r) => r.duplicate).length;
        const failed = results.filter((r) => !r.success).length;

        return res.json({ success: true, results, summary: { total: req.files.length, successful, duplicates, failed } });
    } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/status", authMiddleware, (req, res) => {
    const db = getDatabase();
    const trackCount = db.prepare("SELECT COUNT(*) as count FROM tracks").get().count;
    const albumCount = db.prepare("SELECT COUNT(*) as count FROM albums").get().count;
    const artistCount = db.prepare("SELECT COUNT(*) as count FROM artists").get().count;
    const mappingCount = db.prepare("SELECT COUNT(*) as count FROM provider_mappings WHERE provider = 'telegram'").get().count;
    const channels = db.prepare("SELECT channel_id, title, is_active FROM telegram_channels").all();
    return res.json({ trackCount, albumCount, artistCount, mappingCount, channels });
});

function cleanup(filePath) {
    try { fs.unlinkSync(filePath); } catch {}
}

module.exports = router;
