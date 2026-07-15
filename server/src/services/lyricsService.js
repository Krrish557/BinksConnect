const { getDatabase } = require("../db/database");

const LRCLIB_BASE = "https://lrclib.net/api";
const GENIUS_BASE = "https://genius.com/api";

async function fetchWithRetry(url, options = {}, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
            if (res.status === 429) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise((r) => setTimeout(r, delay));
                continue;
            }
            return res;
        } catch (err) {
            if (i === retries) throw err;
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    return null;
}

function parseLRC(lrc) {
    if (!lrc) return [];
    const lines = lrc.split("\n");
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

    for (const line of lines) {
        const times = [];
        let match;
        while ((match = timeRegex.exec(line)) !== null) {
            const min = parseInt(match[1], 10);
            const sec = parseInt(match[2], 10);
            const ms = match[3].length === 2
                ? parseInt(match[3], 10) * 10
                : parseInt(match[3], 10);
            times.push(min * 60 + sec + ms / 1000);
        }
        const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim();
        for (const time of times) {
            result.push({ time, text });
        }
    }

    return result.sort((a, b) => a.time - b.time);
}

async function fetchFromLRCLIB(artist, title, album, duration) {
    const params = new URLSearchParams({
        artist_name: artist,
        track_name: title,
    });
    if (album) params.set("album_name", album);
    if (duration) params.set("duration", Math.round(duration).toString());

    try {
        const res = await fetchWithRetry(`${LRCLIB_BASE}/get?${params}`);
        if (!res || !res.ok) return null;
        const data = await res.json();
        if (data.instrumental) {
            return { synced: false, plain: "", syncedLines: [], instrumental: true };
        }
        if (data.syncedLyrics) {
            return {
                synced: true,
                plain: data.plainLyrics || "",
                syncedLines: parseLRC(data.syncedLyrics),
            };
        }
        if (data.plainLyrics) {
            return { synced: false, plain: data.plainLyrics, syncedLines: [] };
        }
        return null;
    } catch {
        return null;
    }
}

async function searchLRCLIB(query) {
    try {
        const res = await fetchWithRetry(`${LRCLIB_BASE}/search?q=${encodeURIComponent(query)}`);
        if (!res || !res.ok) return null;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        const best = data[0];
        if (best.instrumental) {
            return { synced: false, plain: "", syncedLines: [], instrumental: true };
        }
        if (best.syncedLyrics) {
            return {
                synced: true,
                plain: best.plainLyrics || "",
                syncedLines: parseLRC(best.syncedLyrics),
            };
        }
        if (best.plainLyrics) {
            return { synced: false, plain: best.plainLyrics, syncedLines: [] };
        }
        return null;
    } catch {
        return null;
    }
}

async function fetchFromGenius(artist, title) {
    try {
        const query = `${artist} ${title}`;
        const res = await fetchWithRetry(
            `${GENIUS_BASE}/search?q=${encodeURIComponent(query)}`,
            { headers: { "User-Agent": "BinksConnect/1.0" } }
        );
        if (!res || !res.ok) return null;
        const data = await res.json();
        const hit = data.response?.hits?.[0];
        if (!hit) return null;

        const songRes = await fetchWithRetry(
            `https://genius.com/api/songs/${hit.result.id}`,
            { headers: { "User-Agent": "BinksConnect/1.0" } }
        );
        if (!songRes || !songRes.ok) return null;
        const songData = await songRes.json();
        const description = songData.response?.song?.description?.plain;
        if (description) {
            return { synced: false, plain: description, syncedLines: [] };
        }
        return null;
    } catch {
        return null;
    }
}

function getCachedLyrics(trackDbId) {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM lyrics_cache WHERE track_id = ?").get(trackDbId);
    if (!row) return null;
    let syncedLines = [];
    if (row.synced_json) {
        try {
            syncedLines = JSON.parse(row.synced_json);
        } catch {
            syncedLines = [];
        }
    }
    return {
        synced: !!row.synced,
        plain: row.plain || "",
        syncedLines,
        provider: row.provider,
        instrumental: row.plain === "__instrumental__",
    };
}

function cacheLyrics(trackDbId, provider, data) {
    const db = getDatabase();
    db.prepare(`
        INSERT OR REPLACE INTO lyrics_cache (track_id, provider, synced, plain, synced_json, fetched_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
        trackDbId,
        provider,
        data.synced ? 1 : 0,
        data.instrumental ? "__instrumental__" : (data.plain || ""),
        data.syncedLines && data.syncedLines.length > 0 ? JSON.stringify(data.syncedLines) : null
    );
}

class LyricsService {
    async fetchLyrics(artist, title, album, duration, trackDbId) {
        if (!artist || !title) return null;

        if (trackDbId) {
            const cached = getCachedLyrics(trackDbId);
            if (cached) return cached;
        }

        let result = await fetchFromLRCLIB(artist, title, album, duration);
        let provider = "lrclib";

        if (!result) {
            const searchQuery = `${artist} ${title}`;
            result = await searchLRCLIB(searchQuery);
            provider = "lrclib";
        }

        if (!result) {
            result = await fetchFromGenius(artist, title);
            provider = "genius";
        }

        if (result && trackDbId) {
            cacheLyrics(trackDbId, provider, result);
        }

        return result;
    }
}

module.exports = new LyricsService();
