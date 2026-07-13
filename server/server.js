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
const { authMiddleware } = require("./src/middleware/auth");
const providerManager = require("./src/providers/manager");

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

app.get("/api/starred", authMiddleware, async (req, res) => {
    try {
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
