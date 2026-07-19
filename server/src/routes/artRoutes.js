const express = require("express");
const { Readable } = require("stream");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");
const metadataService = require("../services/metadataService");
const coverArtService = require("../services/coverArtService");

const PLACEHOLDER_SVG = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <rect width="300" height="300" fill="#282828"/>
        <text x="150" y="160" text-anchor="middle" fill="#B3B3B3" font-family="sans-serif" font-size="64">🎵</text>
    </svg>`
);

const router = express.Router();

function sendImage(res, status, mimeType, cacheControl, data) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    res.writeHead(status, {
        "Content-Type": mimeType,
        "Cache-Control": cacheControl,
        "Content-Length": buf.length,
    });
    res.end(buf);
}

router.get("/:albumId", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const albumId = req.params.albumId;
            const size = req.query.size === "thumb" ? "thumb" : "full";
            console.log(`[Art] Request for albumId=${albumId} size=${size}`);
            let cover = await metadataService.getAlbumCover(albumId, size);
            console.log(`[Art] getAlbumCover:`, cover ? `mimeType=${cover.mimeType} imageLen=${cover.image?.length}` : "null");

            if (!cover) {
                cover = await coverArtService.fetchAndStoreAlbumCover(albumId);
                console.log(`[Art] fetchAndStoreAlbumCover:`, cover ? `mimeType=${cover.mimeType} imageLen=${cover.image?.length}` : "null");
            }

            if (cover) {
                console.log(`[Art] Sending cover image: ${cover.mimeType} ${cover.image?.length} bytes`);
                return sendImage(res, 200, cover.mimeType, "public, max-age=86400", cover.image);
            }

            console.log(`[Art] No cover found, sending placeholder`);
            return sendImage(res, 200, "image/svg+xml", "public, max-age=3600", PLACEHOLDER_SVG);
        }

        const provider = providerManager.getProvider(req.session);
        const result = await provider.getCover(req.params.albumId);

        res.set("Content-Type", result.contentType);
        res.set("Cache-Control", "public, max-age=86400");

        Readable.fromWeb(result.stream).pipe(res);
    } catch (err) {
        console.error("Cover art error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/artist/:artistId", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const artistId = req.params.artistId;
            const size = req.query.size === "thumb" ? "thumb" : "full";
            console.log(`[Art] Request for artistId=${artistId} size=${size}`);
            let cover = await metadataService.getArtistCover(artistId, size);
            console.log(`[Art] getArtistCover:`, cover ? `mimeType=${cover.mimeType} imageLen=${cover.image?.length}` : "null");

            if (!cover) {
                cover = await coverArtService.fetchAndStoreArtistCover(artistId);
                console.log(`[Art] fetchAndStoreArtistCover:`, cover ? `mimeType=${cover.mimeType} imageLen=${cover.image?.length}` : "null");
            }

            if (cover) {
                console.log(`[Art] Sending artist cover: ${cover.mimeType} ${cover.image?.length} bytes`);
                return sendImage(res, 200, cover.mimeType, "public, max-age=86400", cover.image);
            }

            console.log(`[Art] No artist cover found, sending placeholder`);
            return sendImage(res, 200, "image/svg+xml", "public, max-age=3600", PLACEHOLDER_SVG);
        }

        return sendImage(res, 200, "image/svg+xml", "public, max-age=3600", PLACEHOLDER_SVG);
    } catch (err) {
        console.error("Artist art error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
