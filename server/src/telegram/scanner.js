const path = require("path");

const ALLOWED_MIME_TYPES = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/flac",
    "audio/ogg",
    "audio/x-wav",
    "audio/wav",
    "audio/aac",
    "audio/mp4",
    "audio/x-m4a",
    "audio/opus",
    "audio/x-flac",
]);

const ALLOWED_EXTENSIONS = new Set([
    ".mp3", ".flac", ".ogg", ".wav", ".aac", ".m4a", ".opus", ".wma",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const AUDIO_MAGIC_BYTES = [
    { bytes: [0x49, 0x44, 0x33], name: "ID3 (MP3)" },
    { bytes: [0xFF, 0xFB], name: "MP3 Sync" },
    { bytes: [0xFF, 0xF3], name: "MP3 Sync" },
    { bytes: [0xFF, 0xF2], name: "MP3 Sync" },
    { bytes: [0x66, 0x4C, 0x61, 0x43], name: "FLAC" },
    { bytes: [0x4F, 0x67, 0x67, 0x53], name: "OGG" },
    { bytes: [0x52, 0x49, 0x46, 0x46], name: "RIFF (WAV)" },
    { bytes: [0x66, 0x74, 0x79, 0x70], name: "MP4/M4A" },
    { bytes: [0x23, 0x21, 0x41, 0x4D, 0x52], name: "AMR" },
];

function scanFile(buffer, originalName, mimeType) {
    const ext = path.extname(originalName || "").toLowerCase();

    if (originalName && !ALLOWED_EXTENSIONS.has(ext)) {
        return { valid: false, reason: `Unsupported file extension: ${ext}` };
    }

    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
        return { valid: false, reason: `Unsupported MIME type: ${mimeType}` };
    }

    if (buffer && buffer.length === 0) {
        return { valid: false, reason: "File is empty" };
    }

    if (buffer && buffer.length > MAX_FILE_SIZE) {
        return { valid: false, reason: `File exceeds 20MB limit (${(buffer.length / 1024 / 1024).toFixed(1)}MB)` };
    }

    if (buffer && buffer.length >= 4) {
        const magicMatch = AUDIO_MAGIC_BYTES.some((magic) =>
            magic.bytes.every((byte, i) => buffer[i] === byte)
        );
        if (!magicMatch && mimeType !== "audio/ogg" && mimeType !== "audio/opus") {
            return { valid: false, reason: "File does not contain valid audio data" };
        }
    }

    return { valid: true };
}

module.exports = { scanFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
