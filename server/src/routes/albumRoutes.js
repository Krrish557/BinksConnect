const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const offset = parseInt(req.query.offset) || 0;
            const albums = await metadataService.getAlbums(offset);
            return res.json(albums);
        }
        const provider = providerManager.getProvider(req.session);
        const offset = parseInt(req.query.offset) || 0;
        const albums = await provider.getAlbums(offset);
        return res.json(albums);
    } catch (err) {
        console.error("Get albums error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/recent", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const size = parseInt(req.query.size) || 12;
            const albums = await metadataService.getRecentAlbums(req.session.userId, size);
            return res.json(albums);
        }
        const provider = providerManager.getProvider(req.session);
        const size = parseInt(req.query.size) || 12;
        const albums = await provider.getRecentAlbums(size);
        return res.json(albums);
    } catch (err) {
        console.error("Get recent albums error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/newest", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const size = parseInt(req.query.size) || 12;
            const albums = await metadataService.getNewestAlbums(size);
            return res.json(albums);
        }
        const provider = providerManager.getProvider(req.session);
        const size = parseInt(req.query.size) || 12;
        const albums = await provider.getNewestAlbums(size);
        return res.json(albums);
    } catch (err) {
        console.error("Get newest albums error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/frequent", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const size = parseInt(req.query.size) || 12;
            const albums = await metadataService.getFrequentAlbums(req.session.userId, size);
            return res.json(albums);
        }
        const provider = providerManager.getProvider(req.session);
        const size = parseInt(req.query.size) || 12;
        const albums = await provider.getFrequentAlbums(size);
        return res.json(albums);
    } catch (err) {
        console.error("Get frequent albums error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const data = await metadataService.getAlbumTracks(req.params.id);
            if (!data) return res.status(404).json({ error: "Album not found" });
            return res.json(data);
        }
        const provider = providerManager.getProvider(req.session);
        const data = await provider.getAlbumTracks(req.params.id);
        if (!data) return res.status(404).json({ error: "Album not found" });
        return res.json(data);
    } catch (err) {
        console.error("Get album tracks error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
