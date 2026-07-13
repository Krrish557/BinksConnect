const express = require("express");
const crypto = require("crypto");

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { serverUrl, username, password } = req.body;

        const cleanServerUrl = serverUrl
            .replace(/\/$/, "")
            .replace(/\/app\/?#?.*$/, "");

        const salt = Math.random()
            .toString(36)
            .substring(2, 10);

        const token = crypto
            .createHash("md5")
            .update(password + salt)
            .digest("hex");

        const url =
            `${cleanServerUrl}/rest/ping.view` +
            `?u=${encodeURIComponent(username)}` +
            `&s=${salt}` +
            `&t=${token}` +
            `&v=1.16.1` +
            `&c=binksconnect` +
            `&f=json`;

        console.log("Testing URL:", url);

        const response = await fetch(url);
        const data = await response.json();

        console.log(data);

        if (data["subsonic-response"]?.status === "ok") {
            return res.json({
                success: true,
                username,
                serverUrl: cleanServerUrl,
                salt,
                token
            });
        }

        return res.status(401).json({
            success: false,
            error: "Invalid credentials"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;