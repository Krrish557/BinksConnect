const express = require("express");
const crypto = require("crypto");

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { serverUrl, username, password } = req.body;

        const salt = Math.random()
            .toString(36)
            .substring(2, 10);

        const token = crypto
            .createHash("md5")
            .update(password + salt)
            .digest("hex");

        const url = `${serverUrl}/rest/ping.view?u=${encodeURIComponent(
            username
        )}&s=${salt}&t=${token}&v=1.16.1&c=binksconnect&f=json`;

        const response = await fetch(url);
        const data = await response.json();

        if (
            data["subsonic-response"]?.status === "ok"
        ) {
            return res.json({
                success: true,
                username,
                serverUrl,
                salt,
                token
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid credentials"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;    