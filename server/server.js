const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./src/routes/authRoutes");
const albumRoutes = require("./src/routes/albumRoutes");
const artistRoutes = require("./src/routes/artistRoutes");
const trackRoutes = require("./src/routes/trackRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const streamRoutes = require("./src/routes/streamRoutes");
const artRoutes = require("./src/routes/artRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const favoriteRoutes = require("./src/routes/favoriteRoutes");
const lyricsRoutes = require("./src/routes/lyricsRoutes");
const playlistRoutes = require("./src/routes/playlistRoutes");
const smartPlaylistRoutes = require("./src/routes/smartPlaylistRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const { authMiddleware } = require("./src/middleware/auth");
const providerManager = require("./src/providers/manager");
const metadataService = require("./src/services/metadataService");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
    console.log(`[Req] ${req.method} ${req.url}`);
    next();
});
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/art", artRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/lyrics", lyricsRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/smart-playlists", smartPlaylistRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/starred", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const starred = await metadataService.getStarredItems(req.session.userId);
            return res.json(starred);
        }
        const provider = providerManager.getProvider(req.session);
        const starred = await provider.getStarredItems();
        return res.json(starred);
    } catch (err) {
        console.error("Get starred error:", err);
        return res.status(500).json({ error: err.message });
    }
});

app.get("/", (req, res) => {
    res.json({ message: "BinksConnect backend running" });
});

const { startPolling } = require("./src/telegram/bot");
const { initCache } = require("./src/cache/audioCache");
const { initDatabase } = require("./src/db/database");

function startKeepAlive() {
    const url = process.env.RENDER_URL;
    if (!url) {
        console.log("[KeepAlive] RENDER_URL not set — skipping self-ping");
        return;
    }
    console.log(`[KeepAlive] Pinging ${url} every 5 minutes to prevent idle spin-down`);
    setInterval(async () => {
        try {
            const res = await fetch(url);
            console.log(`[KeepAlive] ${url} -> ${res.status}`);
        } catch (err) {
            console.error(`[KeepAlive] Ping failed: ${err.message}`);
        }
    }, 300000);
}

function startHeartbeat() {
    const sudoId = process.env.SUDO_USER_ID;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!sudoId || !token) {
        console.log("[Heartbeat] SUDO_USER_ID or TELEGRAM_BOT_TOKEN not set — skipping");
        return;
    }
    console.log(`[Heartbeat] Sending alive message to sudo user every 5 minutes`);
    const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    setInterval(async () => {
        try {
            const now = new Date().toISOString().slice(11, 19);
            await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: sudoId,
                    text: `[${now}] BinksConnect server is alive`,
                }),
            });
        } catch {}
    }, 300000);
}

if (require.main === module) {
    (async () => {
        try {
            await initDatabase();
        } catch (err) {
            console.error("[DB] Database init failed:", err.message);
        }
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            initCache();
            startPolling();
            startKeepAlive();
            startHeartbeat();
        });
    })();
}

module.exports = app;
