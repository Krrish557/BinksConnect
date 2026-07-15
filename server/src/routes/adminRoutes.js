const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { dbGet, dbAll, dbRun } = require("../db/dbHelpers");
const { health } = require("../telegram/bot");

const router = express.Router();

router.get("/bot-status", authMiddleware, async (req, res) => {
    try {
        const status = await health();
        const channels = await dbAll("SELECT * FROM telegram_channels");
        const trackCountRow = await dbGet("SELECT COUNT(*) as count FROM tracks");
        const trackCount = trackCountRow.count;
        const mappingCountRow = await dbGet("SELECT COUNT(*) as count FROM provider_mappings WHERE provider = 'telegram'");
        const mappingCount = mappingCountRow.count;
        return res.json({ bot: status, channels, trackCount, mappingCount });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get("/channels", authMiddleware, async (req, res) => {
    try {
        const channels = await dbAll("SELECT * FROM telegram_channels ORDER BY created_at ASC");
        return res.json(channels);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.post("/channels", authMiddleware, async (req, res) => {
    try {
        const { channel_id, title, strategy } = req.body;
        if (!channel_id) return res.status(400).json({ error: "channel_id required" });

        const existing = await dbGet("SELECT channel_id FROM telegram_channels WHERE channel_id = ?", channel_id);
        if (existing) return res.status(409).json({ error: "Channel already registered" });

        await dbRun(
            "INSERT INTO telegram_channels (channel_id, title, strategy) VALUES (?, ?, ?)",
            channel_id,
            title || null,
            strategy || "round_robin"
        );

        return res.status(201).json({ success: true, channel_id });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.delete("/channels/:channelId", authMiddleware, async (req, res) => {
    try {
        await dbRun("DELETE FROM telegram_channels WHERE channel_id = ?", req.params.channelId);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
