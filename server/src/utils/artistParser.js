const SEPARATOR_REGEX = /\s*(?:,\s*|\s*\/\s*|\s+x\s+|\s+feat\.?\s+|\s+ft\.?\s+|\s*&\s+|\s+vs\.?\s+|\s+with\s+)\s*/i;

const SPECIAL_ARTISTS = new Set(["various artists"]);

function parseArtists(raw) {
    if (!raw || typeof raw !== "string") return [];

    const trimmed = raw.trim();
    if (!trimmed) return [];

    const lower = trimmed.toLowerCase();
    if (SPECIAL_ARTISTS.has(lower)) return ["Various Artists"];

    const parts = trimmed.split(SEPARATOR_REGEX).filter(Boolean);

    const seen = new Set();
    const result = [];
    for (const part of parts) {
        const name = part.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(name);
    }

    return result.length > 0 ? result : [trimmed];
}

function getPrimaryArtist(raw) {
    const artists = parseArtists(raw);
    return artists.length > 0 ? artists[0] : raw;
}

function normalizeArtistName(name) {
    if (!name || typeof name !== "string") return "";
    return name.trim().toLowerCase().replace(/\s+/g, " ");
}

module.exports = { parseArtists, getPrimaryArtist, normalizeArtistName };
