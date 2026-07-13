const express = require("express");
const { Readable } = require("stream");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");

const router = express.Router();

router.get("/:albumId", authMiddleware, async (req, res) => {
    try {
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
