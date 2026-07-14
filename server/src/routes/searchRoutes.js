const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const query = req.query.q || req.query.query || "";
            if (!query.trim()) {
                return res.json({ songs: [], albums: [], artists: [] });
            }
            const results = metadataService.search(query.trim());
            return res.json(results);
        }
        const provider = providerManager.getProvider(req.session);
        const query = req.query.q || req.query.query || "";
        if (!query.trim()) {
            return res.json({ songs: [], albums: [], artists: [] });
        }
        const results = await provider.search(query.trim());
        return res.json(results);
    } catch (err) {
        console.error("Search error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
