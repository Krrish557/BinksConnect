const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Playlists only supported for Telegram provider" });
        }
        const playlists = await metadataService.getUserPlaylists(req.session.userId);
        return res.json({ playlists });
    } catch (err) {
        console.error("Get playlists error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Playlists only supported for Telegram provider" });
        }
        const { name } = req.body;
        const trimmed = (name || "").trim();
        if (!trimmed) return res.status(400).json({ error: "Playlist name required" });
        if (trimmed.length > 200) return res.status(400).json({ error: "Playlist name too long (max 200 chars)" });
        const playlist = await metadataService.createPlaylist(req.session.userId, trimmed);
        return res.json(playlist);
    } catch (err) {
        console.error("Create playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Playlists only supported for Telegram provider" });
        }
        const playlist = await metadataService.getPlaylist(req.params.id, req.session.userId);
        if (!playlist) return res.status(404).json({ error: "Playlist not found" });
        return res.json(playlist);
    } catch (err) {
        console.error("Get playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Playlists only supported for Telegram provider" });
        }
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "name required" });
        await metadataService.renamePlaylist(req.params.id, req.session.userId, name);
        return res.json({ success: true });
    } catch (err) {
        console.error("Rename playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Playlists only supported for Telegram provider" });
        }
        const deleted = await metadataService.deletePlaylist(req.params.id, req.session.userId);
        if (!deleted) return res.status(404).json({ error: "Playlist not found" });
        return res.json({ success: true });
    } catch (err) {
        console.error("Delete playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/:id/tracks", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Playlists only supported for Telegram provider" });
        }
        const { trackId, position } = req.body;
        if (!trackId) return res.status(400).json({ error: "trackId required" });
        const added = await metadataService.addTrackToPlaylist(req.params.id, req.session.userId, trackId, position);
        if (!added) return res.status(404).json({ error: "Playlist or track not found" });
        return res.json({ success: true });
    } catch (err) {
        console.error("Add track to playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.delete("/:id/tracks/:trackId", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Playlists only supported for Telegram provider" });
        }
        const removed = await metadataService.removeTrackFromPlaylist(req.params.id, req.session.userId, req.params.trackId);
        if (!removed) return res.status(404).json({ error: "Playlist or track not found" });
        return res.json({ success: true });
    } catch (err) {
        console.error("Remove track from playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.put("/:id/reorder", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Playlists only supported for Telegram provider" });
        }
        const { trackIds } = req.body;
        if (!Array.isArray(trackIds) || trackIds.length === 0) return res.status(400).json({ error: "Non-empty trackIds array required" });
        const reordered = await metadataService.reorderPlaylist(req.params.id, req.session.userId, trackIds);
        if (!reordered) return res.status(404).json({ error: "Playlist not found" });
        return res.json({ success: true });
    } catch (err) {
        console.error("Reorder playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
