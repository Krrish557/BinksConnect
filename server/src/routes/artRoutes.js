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

router.get("/:albumId", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const size = req.query.size === "thumb" ? "thumb" : "full";
            let cover = await metadataService.getAlbumCover(req.params.albumId, size);

            if (!cover) {
                cover = await coverArtService.fetchAndStoreAlbumCover(req.params.albumId);
            }

            if (cover) {
                console.log({
                    value: cover.image,
                    type: typeof cover.image,
                    constructor: cover.image?.constructor?.name,
                    isBuffer: Buffer.isBuffer(cover.image),
                    length: cover.image?.length,
                    byteLength: cover.image?.byteLength
                });
                res.set("Content-Type", cover.mimeType);
                res.set("Cache-Control", "public, max-age=86400");
                return res.send(cover.image);
            }

            res.set("Content-Type", "image/svg+xml");
            res.set("Cache-Control", "public, max-age=3600");
            return res.send(PLACEHOLDER_SVG);
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
            const size = req.query.size === "thumb" ? "thumb" : "full";
            let cover = await metadataService.getArtistCover(req.params.artistId, size);

            if (!cover) {
                cover = await coverArtService.fetchAndStoreArtistCover(req.params.artistId);
            }

            if (cover) {
                res.set("Content-Type", cover.mimeType);
                res.set("Cache-Control", "public, max-age=86400");
                return res.send(cover.image);
            }

            res.set("Content-Type", "image/svg+xml");
            res.set("Cache-Control", "public, max-age=3600");
            return res.send(PLACEHOLDER_SVG);
        }

        res.set("Content-Type", "image/svg+xml");
        res.set("Cache-Control", "public, max-age=3600");
        return res.send(PLACEHOLDER_SVG);
    } catch (err) {
        console.error("Artist art error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
