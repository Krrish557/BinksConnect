const express = require("express");
const { Readable } = require("stream");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");

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

module.exports = router;
