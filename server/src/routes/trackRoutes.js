const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.get("/random", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const size = parseInt(req.query.size) || 20;
            const songs = metadataService.getRandomSongs(size);
            return res.json(songs);
        }
        const provider = providerManager.getProvider(req.session);
        const size = parseInt(req.query.size) || 20;
        const songs = await provider.getRandomSongs(size);
        return res.json(songs);
    } catch (err) {
        console.error("Get random songs error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const offset = parseInt(req.query.offset) || 0;
            const songs = metadataService.getSongs(offset);
            return res.json(songs);
        }
        const provider = providerManager.getProvider(req.session);
        const offset = parseInt(req.query.offset) || 0;
        const songs = await provider.getSongs(offset);
        return res.json(songs);
    } catch (err) {
        console.error("Get songs error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/starred", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const starred = metadataService.getStarredItems(req.session.userId);
            return res.json(starred);
        }
        const provider = providerManager.getProvider(req.session);
        const starred = await provider.getStarredItems();
        return res.json(starred);
    } catch (err) {
        console.error("Get starred error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
