const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const lyricsService = require("../services/lyricsService");
const metadataService = require("../services/metadataService");

router.get("/:trackInternalId", authMiddleware, async (req, res) => {
    try {
        const { trackInternalId } = req.params;
        const db = require("../db/database").getDatabase();

        const track = db.prepare(`
            SELECT t.id as dbId, t.title, t.duration,
                   ar.name as artist,
                   a.name as album
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE t.internal_id = ?
        `).get(trackInternalId);

        if (!track) {
            return res.status(404).json({ error: "Track not found" });
        }

        const result = await lyricsService.fetchLyrics(
            track.artist,
            track.title,
            track.album,
            track.duration,
            track.dbId
        );

        if (!result) {
            return res.json({ synced: false, plain: "", syncedLines: [], notFound: true });
        }

        return res.json(result);
    } catch (err) {
        console.error("Lyrics fetch error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
