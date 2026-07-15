const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const providerManager = require("../providers/manager");
const metadataService = require("../services/metadataService");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const query = (req.query.q || req.query.query || "").trim();
            if (!query) {
                return res.json({ songs: [], albums: [], artists: [] });
            }
            if (query.length > 200) return res.status(400).json({ error: "Query too long (max 200 chars)" });
            const results = metadataService.searchFTS5(query);
            return res.json(results);
        }
        const provider = providerManager.getProvider(req.session);
        const query = (req.query.q || req.query.query || "").trim();
        if (!query) {
            return res.json({ songs: [], albums: [], artists: [] });
        }
        if (query.length > 200) return res.status(400).json({ error: "Query too long (max 200 chars)" });
        const results = await provider.search(query);
        return res.json(results);
    } catch (err) {
        console.error("Search error:", err);
        return res.status(500).json({ error: "Search failed" });
    }
});

module.exports = router;
