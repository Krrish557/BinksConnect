const jwt = require("jsonwebtoken");
const { dbGet } = require("../db/dbHelpers");

const JWT_SECRET = process.env.JWT_SECRET || "binksconnect-dev-secret-change-in-production";

async function authMiddleware(req, res, next) {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const session = await dbGet("SELECT * FROM sessions WHERE id = ?", decoded.sessionId);

        if (!session) {
            return res.status(401).json({ error: "Session not found" });
        }

        req.session = {
            sessionId: session.id,
            userId: session.user_id,
            providerId: session.provider_id,
            providerConfig: JSON.parse(session.provider_config),
        };

        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

function generateToken(sessionId, userId) {
    return jwt.sign({ sessionId, userId }, JWT_SECRET, { expiresIn: "30d" });
}

module.exports = { authMiddleware, generateToken, JWT_SECRET };
