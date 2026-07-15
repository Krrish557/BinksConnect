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
        if (trackIds.length > 100) return res.status(400).json({ error: "Maximum 100 trackIds per request" });
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

// ─── Artist Favourites ──────────────────────────────

router.post("/artists/toggle", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Only supported for Telegram provider" });
        }
        const { artistId } = req.body;
        if (!artistId) return res.status(400).json({ error: "artistId required" });
        const isFavorited = metadataService.toggleFavoriteArtist(req.session.userId, artistId);
        return res.json({ success: true, isFavorited });
    } catch (err) {
        console.error("Toggle favourite artist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/artists/check", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Only supported for Telegram provider" });
        }
        const { artistIds } = req.body;
        if (!Array.isArray(artistIds) || artistIds.length === 0) {
            return res.json({ favorited: {} });
        }
        if (artistIds.length > 100) return res.status(400).json({ error: "Maximum 100 artistIds per request" });
        const favorited = metadataService.checkFavoriteArtists(req.session.userId, artistIds);
        return res.json({ favorited });
    } catch (err) {
        console.error("Check favourite artists error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/artists", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Only supported for Telegram provider" });
        }
        const artists = metadataService.getFavouriteArtists(req.session.userId);
        return res.json({ artists });
    } catch (err) {
        console.error("Get favourite artists error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ─── Album Favourites ───────────────────────────────

router.post("/albums/toggle", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Only supported for Telegram provider" });
        }
        const { albumId } = req.body;
        if (!albumId) return res.status(400).json({ error: "albumId required" });
        const isFavorited = metadataService.toggleFavoriteAlbum(req.session.userId, albumId);
        return res.json({ success: true, isFavorited });
    } catch (err) {
        console.error("Toggle favourite album error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/albums/check", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Only supported for Telegram provider" });
        }
        const { albumIds } = req.body;
        if (!Array.isArray(albumIds) || albumIds.length === 0) {
            return res.json({ favorited: {} });
        }
        if (albumIds.length > 100) return res.status(400).json({ error: "Maximum 100 albumIds per request" });
        const favorited = metadataService.checkFavoriteAlbums(req.session.userId, albumIds);
        return res.json({ favorited });
    } catch (err) {
        console.error("Check favourite albums error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/albums", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId !== "telegram") {
            return res.status(400).json({ error: "Only supported for Telegram provider" });
        }
        const albums = metadataService.getFavouriteAlbums(req.session.userId);
        return res.json({ albums });
    } catch (err) {
        console.error("Get favourite albums error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
