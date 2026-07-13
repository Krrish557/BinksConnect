const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { getDatabase } = require("../db/database");
const { generateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        const db = getDatabase();
        const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (existing) {
            return res.status(409).json({ error: "Username already exists" });
        }

        const hash = bcrypt.hashSync(password, 10);
        const result = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, hash);

        return res.status(201).json({ success: true, userId: result.lastInsertRowid });
    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { providerId, config } = req.body;
        const { username, password, serverUrl } = config || req.body;

        if (providerId === "navidrome" || (!providerId && serverUrl)) {
            const cleanServerUrl = (serverUrl || config?.serverUrl || "")
                .replace(/\/$/, "")
                .replace(/\/app\/?#?.*$/, "");

            const subsonicUser = config?.username || username;
            const subsonicPassword = config?.password || password;

            if (!cleanServerUrl || !subsonicUser || !subsonicPassword) {
                return res.status(400).json({ error: "serverUrl, username, and password are required" });
            }

            const salt = Math.random().toString(36).substring(2, 10);
            const token = crypto.createHash("md5").update(subsonicPassword + salt).digest("hex");

            const url =
                `${cleanServerUrl}/rest/ping.view` +
                `?u=${encodeURIComponent(subsonicUser)}` +
                `&s=${salt}&t=${token}` +
                `&v=1.16.1&c=binksconnect&f=json`;

            const response = await fetch(url);
            const data = await response.json();

            if (data["subsonic-response"]?.status !== "ok") {
                return res.status(401).json({ error: "Invalid Navidrome credentials" });
            }

            const db = getDatabase();
            const dbUser = db.prepare("SELECT id FROM users WHERE username = ?").get(subsonicUser);

            let userId;
            if (dbUser) {
                userId = dbUser.id;
            } else {
                const fakeHash = bcrypt.hashSync(subsonicPassword, 10);
                const result = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(subsonicUser, fakeHash);
                userId = result.lastInsertRowid;
            }

            const sessionId = crypto.randomUUID();
            const providerConfig = {
                serverUrl: cleanServerUrl,
                username: subsonicUser,
                salt,
                token,
            };

            db.prepare("INSERT INTO sessions (id, user_id, provider_id, provider_config) VALUES (?, ?, ?, ?)").run(
                sessionId,
                userId,
                "navidrome",
                JSON.stringify(providerConfig)
            );

            const jwtToken = generateToken(sessionId, userId);

            return res.json({
                success: true,
                token: jwtToken,
                providerId: "navidrome",
                displayName: "Navidrome",
            });
        }

        return res.status(400).json({ error: "Unsupported provider" });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/me", require("../middleware/auth").authMiddleware, (req, res) => {
    return res.json({
        success: true,
        providerId: req.session.providerId,
        username: req.session.providerConfig.username,
        serverUrl: req.session.providerConfig.serverUrl,
    });
});

router.post("/logout", require("../middleware/auth").authMiddleware, (req, res) => {
    try {
        const db = getDatabase();
        db.prepare("DELETE FROM sessions WHERE id = ?").run(req.session.sessionId);
        return res.json({ success: true });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
