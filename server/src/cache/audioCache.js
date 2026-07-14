const fs = require("fs");
const path = require("path");
const { getDatabase } = require("../db/database");

const CACHE_DIR = path.join(__dirname, "../../cache/audio");
const MAX_CACHE_BYTES = parseInt(process.env.AUDIO_CACHE_MAX_MB || "2048", 10) * 1024 * 1024;

function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCachePath(checksum) {
    return path.join(CACHE_DIR, `${checksum}.audio`);
}

function getEntry(checksum) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM cache_entries WHERE checksum = ?").get(checksum);
}

function touchEntry(checksum) {
    const db = getDatabase();
    db.prepare("UPDATE cache_entries SET last_accessed = CURRENT_TIMESTAMP WHERE checksum = ?").run(checksum);
}

function insertEntry(checksum, filePath, fileSize) {
    const db = getDatabase();
    db.prepare(`
        INSERT OR REPLACE INTO cache_entries (checksum, file_path, file_size, last_accessed)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(checksum, filePath, fileSize);
}

function removeEntry(checksum) {
    const db = getDatabase();
    const entry = db.prepare("SELECT file_path FROM cache_entries WHERE checksum = ?").get(checksum);
    if (entry && fs.existsSync(entry.file_path)) {
        try { fs.unlinkSync(entry.file_path); } catch {}
    }
    db.prepare("DELETE FROM cache_entries WHERE checksum = ?").run(checksum);
}

function getTotalCacheSize() {
    const db = getDatabase();
    const row = db.prepare("SELECT COALESCE(SUM(file_size), 0) as total FROM cache_entries").get();
    return row.total;
}

function evictLRU(targetBytes) {
    const db = getDatabase();
    let currentSize = getTotalCacheSize();
    while (currentSize > targetBytes) {
        const oldest = db.prepare("SELECT checksum, file_size FROM cache_entries ORDER BY last_accessed ASC LIMIT 1").get();
        if (!oldest) break;
        removeEntry(oldest.checksum);
        currentSize -= oldest.file_size;
    }
}

function initCache() {
    ensureCacheDir();
    const db = getDatabase();
    const entries = db.prepare("SELECT * FROM cache_entries").all();
    let removed = 0;
    for (const entry of entries) {
        if (!fs.existsSync(entry.file_path)) {
            db.prepare("DELETE FROM cache_entries WHERE checksum = ?").run(entry.checksum);
            removed++;
        }
    }
    if (removed > 0) {
        console.log(`[AudioCache] Cleaned ${removed} stale entries`);
    }
    const totalMB = (getTotalCacheSize() / 1024 / 1024).toFixed(1);
    console.log(`[AudioCache] Initialized: ${entries.length - removed} entries, ${totalMB}MB cached`);
}

function getCachedStream(checksum) {
    const entry = getEntry(checksum);
    if (!entry) return null;
    if (!fs.existsSync(entry.file_path)) {
        removeEntry(checksum);
        return null;
    }
    touchEntry(checksum);
    const stat = fs.statSync(entry.file_path);
    return {
        stream: fs.createReadStream(entry.file_path),
        fileSize: stat.size,
    };
}

function storeToCache(checksum, data) {
    ensureCacheDir();
    const cachePath = getCachePath(checksum);
    const newSize = Buffer.isBuffer(data) ? data.length : data.byteLength;
    const requiredSpace = Math.max(0, newSize - (getEntry(checksum)?.file_size || 0));
    if (getTotalCacheSize() + requiredSpace > MAX_CACHE_BYTES) {
        evictLRU(MAX_CACHE_BYTES - newSize);
    }
    fs.writeFileSync(cachePath, data);
    insertEntry(checksum, cachePath, newSize);
    return cachePath;
}

function getCacheStats() {
    const db = getDatabase();
    const row = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize FROM cache_entries").get();
    return {
        entries: row.count,
        totalBytes: row.totalSize,
        totalMB: (row.totalSize / 1024 / 1024).toFixed(1),
        maxMB: MAX_CACHE_BYTES / 1024 / 1024,
        cacheDir: CACHE_DIR,
    };
}

function clearCache() {
    const db = getDatabase();
    const entries = db.prepare("SELECT checksum FROM cache_entries").all();
    for (const entry of entries) {
        removeEntry(entry.checksum);
    }
    console.log(`[AudioCache] Cleared ${entries.length} entries`);
}

function removeChecksum(checksum) {
    removeEntry(checksum);
}

module.exports = {
    initCache,
    getCachedStream,
    storeToCache,
    getCacheStats,
    clearCache,
    removeChecksum,
    CACHE_DIR,
    MAX_CACHE_BYTES,
};
