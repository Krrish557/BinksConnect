const express = require("express");
const { Readable } = require("stream");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");
const TelegramStorageProvider = require("../providers/telegram");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.get("/:trackId", authMiddleware, async (req, res) => {
    try {
        const rangeHeader = req.headers.range || null;

        if (req.session.providerId === "telegram") {
            const provider = new TelegramStorageProvider({});
            const result = await provider.download(req.params.trackId, rangeHeader);

            metadataService.recordPlay(req.session.userId, req.params.trackId);

            res.set("Content-Type", result.contentType);
            res.set("Accept-Ranges", "bytes");
            res.set("Cache-Control", "private, max-age=86400");

            if (result.contentLength) {
                res.set("Content-Length", result.contentLength);
            }

            if (result.status === 206 && result.contentRange) {
                res.set("Content-Range", result.contentRange);
                res.status(206);
            }

            result.stream.pipe(res);
            return;
        }

        const provider = providerManager.getProvider(req.session);
        const result = await provider.getStream(req.params.trackId, rangeHeader);

        res.set("Content-Type", result.contentType);
        res.set("Accept-Ranges", "bytes");
        res.set("Cache-Control", "private, max-age=86400");

        if (result.contentLength) {
            res.set("Content-Length", result.contentLength);
        }

        if (result.status === 206 && result.contentRange) {
            res.set("Content-Range", result.contentRange);
            res.status(206);
        }

        Readable.fromWeb(result.stream).pipe(res);
    } catch (err) {
        console.error("Stream error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
