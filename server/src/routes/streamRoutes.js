const express = require("express");
const { Readable } = require("stream");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");

const router = express.Router();

router.get("/:trackId", authMiddleware, async (req, res) => {
    try {
        const provider = providerManager.getProvider(req.session);
        const rangeHeader = req.headers.range || null;
        const result = await provider.getStream(req.params.trackId, rangeHeader);

        res.set("Content-Type", result.contentType);
        res.set("Accept-Ranges", "bytes");

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
