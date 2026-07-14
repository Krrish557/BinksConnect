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
const adminRoutes = require("./src/routes/adminRoutes");
const { authMiddleware } = require("./src/middleware/auth");
const providerManager = require("./src/providers/manager");
const metadataService = require("./src/services/metadataService");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use("/api/admin", adminRoutes);

app.get("/api/starred", authMiddleware, async (req, res) => {
    try {
        if (req.session.providerId === "telegram") {
            const starred = metadataService.getStarredItems(req.session.userId);
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startPolling();
});
