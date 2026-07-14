const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { getDatabase } = require("../db/database");
const { health } = require("../telegram/bot");

const router = express.Router();

router.get("/bot-status", authMiddleware, async (req, res) => {
    try {
        const status = await health();
        const db = getDatabase();
        const channels = db.prepare("SELECT * FROM telegram_channels").all();
        const trackCount = db.prepare("SELECT COUNT(*) as count FROM tracks").get().count;
        const mappingCount = db.prepare("SELECT COUNT(*) as count FROM provider_mappings WHERE provider = 'telegram'").get().count;
        return res.json({ bot: status, channels, trackCount, mappingCount });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get("/channels", authMiddleware, (req, res) => {
    try {
        const db = getDatabase();
        const channels = db.prepare("SELECT * FROM telegram_channels ORDER BY created_at ASC").all();
        return res.json(channels);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.post("/channels", authMiddleware, (req, res) => {
    try {
        const { channel_id, title, strategy } = req.body;
        if (!channel_id) return res.status(400).json({ error: "channel_id required" });

        const db = getDatabase();
        const existing = db.prepare("SELECT channel_id FROM telegram_channels WHERE channel_id = ?").get(channel_id);
        if (existing) return res.status(409).json({ error: "Channel already registered" });

        db.prepare("INSERT INTO telegram_channels (channel_id, title, strategy) VALUES (?, ?, ?)").run(
            channel_id,
            title || null,
            strategy || "round_robin"
        );

        return res.status(201).json({ success: true, channel_id });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.delete("/channels/:channelId", authMiddleware, (req, res) => {
    try {
        const db = getDatabase();
        db.prepare("DELETE FROM telegram_channels WHERE channel_id = ?").run(req.params.channelId);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
