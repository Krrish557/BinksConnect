const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { dbGet, dbRun } = require("../db/dbHelpers");
const { generateToken } = require("../middleware/auth");
const { sendOtp, sendPasswordReset } = require("../services/emailService");
const { generateOtp, hashCode, generateResetToken } = require("../utils/otp");
const { consume, isInCooldown } = require("../utils/rateLimit");

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

function validateCredentials({ username, email, password }) {
    if (typeof username !== "string" || !USERNAME_REGEX.test(username)) {
        return { error: "Username must be 3-30 characters (letters, numbers, _ . -)" };
    }
    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return { error: "A valid email address is required" };
    }
    if (typeof password !== "string" || password.length < 8) {
        return { error: "Password must be at least 8 characters" };
    }
    return { error: null };
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function normalizeIdentifier(identifier) {
    return String(identifier || "").trim().toLowerCase();
}

async function issueOtp(userId, purpose) {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    await dbRun(
        "INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at) VALUES (?, ?, ?, ?)",
        userId,
        hashCode(code),
        purpose,
        expiresAt
    );
    return code;
}

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const cleanedEmail = normalizeEmail(email);

        const { error } = validateCredentials({ username, email: cleanedEmail, password });
        if (error) return res.status(400).json({ error });

        const rate = consume(`register:${cleanedEmail}`, 5, 60 * 60 * 1000);
        if (!rate.allowed) {
            return res.status(429).json({ error: "Too many signup attempts. Please try again later." });
        }

        const existing = await dbGet(
            "SELECT id, username, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
            String(username).toLowerCase(),
            cleanedEmail
        );
        if (existing) {
            const isUsernameTaken = String(existing.username).toLowerCase() === String(username).toLowerCase();
            return res.status(409).json({
                error: isUsernameTaken ? "Username already exists" : "Email already registered",
            });
        }

        const hash = bcrypt.hashSync(password, 10);
        const result = await dbRun(
            "INSERT INTO users (username, email, email_verified, password_hash) VALUES (?, ?, 0, ?)",
            username,
            cleanedEmail,
            hash
        );

        const code = await issueOtp(result.lastInsertRowid, "signup");
        await sendOtp(cleanedEmail, code);

        return res.status(201).json({ success: true, email: cleanedEmail });
    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/verify-otp", async (req, res) => {
    try {
        const { email, code } = req.body;
        const cleanedEmail = normalizeEmail(email);
        if (!cleanedEmail || typeof code !== "string" || !code) {
            return res.status(400).json({ error: "Email and code are required" });
        }

        const user = await dbGet("SELECT id, email FROM users WHERE LOWER(email) = ?", cleanedEmail);
        if (!user) return res.status(400).json({ error: "No account found for that email" });

        const rate = consume(`verify:${cleanedEmail}`, 5, 60 * 60 * 1000);
        if (!rate.allowed) {
            return res.status(429).json({ error: "Too many verification attempts. Please try again later." });
        }

        const otp = await dbGet(
            "SELECT * FROM otp_codes WHERE user_id = ? AND purpose = 'signup' AND used = 0 ORDER BY id DESC LIMIT 1",
            user.id
        );
        if (!otp) return res.status(400).json({ error: "No pending code. Request a new one." });

        if (new Date(otp.expires_at).getTime() < Date.now()) {
            return res.status(400).json({ error: "Code expired. Request a new one." });
        }
        if (otp.code_hash !== hashCode(code)) {
            return res.status(400).json({ error: "Invalid code" });
        }

        await dbRun("UPDATE otp_codes SET used = 1 WHERE id = ?", otp.id);
        await dbRun("UPDATE users SET email_verified = 1 WHERE id = ?", user.id);

        return res.json({ success: true });
    } catch (err) {
        console.error("Verify OTP error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/resend-otp", async (req, res) => {
    try {
        const cleanedEmail = normalizeEmail(req.body?.email);
        if (!cleanedEmail) return res.status(400).json({ error: "Email is required" });

        const user = await dbGet("SELECT id, email FROM users WHERE LOWER(email) = ?", cleanedEmail);
        if (!user) return res.json({ success: true });

        const rate = consume(`register:${cleanedEmail}`, 5, 60 * 60 * 1000);
        if (!rate.allowed) {
            return res.status(429).json({ error: "Too many requests. Please try again later." });
        }
        if (isInCooldown(`otp:${cleanedEmail}`, 60 * 1000)) {
            return res.status(429).json({ error: "Please wait a minute before requesting another code." });
        }

        await dbRun("UPDATE otp_codes SET used = 1 WHERE user_id = ? AND purpose = 'signup' AND used = 0", user.id);
        const code = await issueOtp(user.id, "signup");
        await sendOtp(cleanedEmail, code);

        return res.json({ success: true });
    } catch (err) {
        console.error("Resend OTP error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const cleanedIdentifier = normalizeIdentifier(identifier);

        if (req.body.providerId || req.body.serverUrl || req.body.config) {
            return handleProviderLogin(req, res);
        }

        if (!cleanedIdentifier || typeof password !== "string" || !password) {
            return res.status(400).json({ error: "Username/email and password are required" });
        }

        const rate = consume(`login:${cleanedIdentifier}`, 10, 15 * 60 * 1000);
        if (!rate.allowed) {
            return res.status(429).json({ error: "Too many login attempts. Please try again later." });
        }

        const user = await dbGet(
            "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
            cleanedIdentifier,
            cleanedIdentifier
        );
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: "Invalid username/email or password" });
        }
        if (!user.email_verified) {
            return res.status(403).json({ error: "Email not verified. Check your inbox for the OTP." });
        }

        const sessionId = crypto.randomUUID();
        const providerConfig = {
            local: true,
            username: user.username,
            email: user.email,
        };

        await dbRun(
            "INSERT INTO sessions (id, user_id, provider_id, provider_config) VALUES (?, ?, ?, ?)",
            sessionId,
            user.id,
            "telegram",
            JSON.stringify(providerConfig)
        );

        const jwtToken = generateToken(sessionId, user.id);

        return res.json({
            success: true,
            token: jwtToken,
            providerId: "telegram",
            displayName: user.username,
            username: user.username,
            email: user.email,
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const cleanedEmail = normalizeEmail(req.body?.email);
        if (!cleanedEmail) return res.status(400).json({ error: "Email is required" });

        const rate = consume(`forgot:${cleanedEmail}`, 5, 60 * 60 * 1000);
        if (!rate.allowed) {
            return res.status(429).json({ error: "Too many requests. Please try again later." });
        }

        const user = await dbGet("SELECT id, email, email_verified FROM users WHERE LOWER(email) = ?", cleanedEmail);
        if (user && user.email_verified) {
            const token = generateResetToken();
            const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
            await dbRun(
                "INSERT INTO reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
                user.id,
                hashCode(token),
                expiresAt
            );
            await sendPasswordReset(user.email, `${CLIENT_URL}/reset-password?token=${token}`);
        }

        return res.json({ success: true });
    } catch (err) {
        console.error("Forgot password error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body;
        if (typeof token !== "string" || !token) return res.status(400).json({ error: "Token is required" });
        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        const reset = await dbGet(
            "SELECT * FROM reset_tokens WHERE token_hash = ? AND used = 0 ORDER BY id DESC LIMIT 1",
            hashCode(token)
        );
        if (!reset) return res.status(400).json({ error: "Invalid or already-used reset link" });
        if (new Date(reset.expires_at).getTime() < Date.now()) {
            return res.status(400).json({ error: "Reset link expired. Request a new one." });
        }

        const hash = bcrypt.hashSync(password, 10);
        await dbRun("UPDATE users SET password_hash = ? WHERE id = ?", hash, reset.user_id);
        await dbRun("UPDATE reset_tokens SET used = 1 WHERE id = ?", reset.id);
        await dbRun("DELETE FROM sessions WHERE user_id = ?", reset.user_id);

        return res.json({ success: true });
    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/me", require("../middleware/auth").authMiddleware, (req, res) => {
    const data = {
        success: true,
        providerId: req.session.providerId,
        username: req.session.providerConfig.username || "telegram_user",
    };
    if (req.session.providerConfig.local) {
        data.local = true;
        data.email = req.session.providerConfig.email || null;
    }
    if (req.session.providerConfig.serverUrl) {
        data.serverUrl = req.session.providerConfig.serverUrl;
    }
    return res.json(data);
});

router.post("/logout", require("../middleware/auth").authMiddleware, async (req, res) => {
    try {
        await dbRun("DELETE FROM sessions WHERE id = ?", req.session.sessionId);
        return res.json({ success: true });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: err.message });
    }
});

async function handleProviderLogin(req, res) {
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

        const dbUser = await dbGet("SELECT id FROM users WHERE username = ?", subsonicUser);

        let userId;
        if (dbUser) {
            userId = dbUser.id;
        } else {
            const fakeHash = bcrypt.hashSync(subsonicPassword, 10);
            const result = await dbRun("INSERT INTO users (username, password_hash) VALUES (?, ?)", subsonicUser, fakeHash);
            userId = result.lastInsertRowid;
        }

        const sessionId = crypto.randomUUID();
        const providerConfig = {
            serverUrl: cleanServerUrl,
            username: subsonicUser,
            salt,
            token,
        };

        await dbRun(
            "INSERT INTO sessions (id, user_id, provider_id, provider_config) VALUES (?, ?, ?, ?)",
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

    if (providerId === "telegram") {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            return res.status(500).json({ error: "Telegram bot not configured on server" });
        }

        const telegramUser = "telegram_user";
        let dbUser = await dbGet("SELECT id FROM users WHERE username = ?", telegramUser);
        let userId;
        if (dbUser) {
            userId = dbUser.id;
        } else {
            const fakeHash = bcrypt.hashSync("telegram-session", 10);
            const result = await dbRun("INSERT INTO users (username, password_hash) VALUES (?, ?)", telegramUser, fakeHash);
            userId = result.lastInsertRowid;
        }

        const sessionId = crypto.randomUUID();
        const providerConfig = { botConfigured: true };

        await dbRun(
            "INSERT INTO sessions (id, user_id, provider_id, provider_config) VALUES (?, ?, ?, ?)",
            sessionId, userId, "telegram", JSON.stringify(providerConfig)
        );

        const jwtToken = generateToken(sessionId, userId);

        return res.json({
            success: true,
            token: jwtToken,
            providerId: "telegram",
            displayName: "Telegram",
        });
    }

    return res.status(400).json({ error: "Unsupported provider" });
}

module.exports = router;
