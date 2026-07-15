const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Smart playlists only supported for Telegram provider" });
        }
        const playlists = metadataService.getUserSmartPlaylists(req.session.userId);
        return res.json({ playlists });
    } catch (err) {
        console.error("Get smart playlists error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Smart playlists only supported for Telegram provider" });
        }
        const { name, ruleType, ruleLimit } = req.body;
        if (!name || !ruleType) return res.status(400).json({ error: "name and ruleType required" });
        const validTypes = ["most_played", "recently_added", "frequently_played", "forgotten_gems", "random"];
        if (!validTypes.includes(ruleType)) return res.status(400).json({ error: `ruleType must be one of: ${validTypes.join(", ")}` });
        const safeLimit = Math.max(1, Math.min(500, parseInt(ruleLimit, 10) || 50));
        const playlist = metadataService.createSmartPlaylist(req.session.userId, name, ruleType, safeLimit);
        return res.json(playlist);
    } catch (err) {
        console.error("Create smart playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Smart playlists only supported for Telegram provider" });
        }
        const result = metadataService.evaluateSmartPlaylist(req.params.id, req.session.userId);
        if (!result) return res.status(404).json({ error: "Smart playlist not found" });
        return res.json(result);
    } catch (err) {
        console.error("Evaluate smart playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Smart playlists only supported for Telegram provider" });
        }
        const deleted = metadataService.deleteSmartPlaylist(req.params.id, req.session.userId);
        if (!deleted) return res.status(404).json({ error: "Smart playlist not found" });
        return res.json({ success: true });
    } catch (err) {
        console.error("Delete smart playlist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
