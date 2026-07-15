const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const artists = await metadataService.getArtists();
            return res.json(artists);
        }
        const provider = providerManager.getProvider(req.session);
        const artists = await provider.getArtists();
        return res.json(artists);
    } catch (err) {
        console.error("Get artists error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const artist = await metadataService.getArtist(req.params.id);
            if (!artist) return res.status(404).json({ error: "Artist not found" });
            return res.json(artist);
        }
        const provider = providerManager.getProvider(req.session);
        const artist = await provider.getArtist(req.params.id);
        if (!artist) return res.status(404).json({ error: "Artist not found" });
        return res.json(artist);
    } catch (err) {
        console.error("Get artist error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
