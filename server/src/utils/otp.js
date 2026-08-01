const crypto = require("crypto");

function generateOtp() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

function hashCode(value) {
    return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function generateResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

module.exports = { generateOtp, hashCode, generateResetToken };
