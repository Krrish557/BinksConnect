const crypto = require("crypto");

function generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString("hex");
    return `${prefix}_${timestamp}${random}`;
}

function extractRawId(internalId) {
    const parts = internalId.split("_");
    return parts.length > 1 ? parts.slice(1).join("_") : internalId;
}

module.exports = { generateId, extractRawId };
