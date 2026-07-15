const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.post("/toggle", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Favorites only supported for Telegram provider" });
        }
        const { trackId } = req.body;
        if (!trackId) return res.status(400).json({ error: "trackId required" });
        const isFavorited = metadataService.toggleFavorite(req.session.userId, trackId);
        return res.json({ success: true, isFavorited });
    } catch (err) {
        console.error("Toggle favorite error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/check", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Favorites only supported for Telegram provider" });
        }
        const { trackIds } = req.body;
        if (!Array.isArray(trackIds) || trackIds.length === 0) {
            return res.json({ favorited: {} });
        }
        const favorited = metadataService.checkFavorites(req.session.userId, trackIds);
        return res.json({ favorited });
    } catch (err) {
        console.error("Check favorites error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Favorites only supported for Telegram provider" });
        }
        const starred = metadataService.getStarredItems(req.session.userId);
        return res.json(starred);
    } catch (err) {
        console.error("Get favorites error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
