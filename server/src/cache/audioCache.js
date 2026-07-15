const fs = require("fs");
const path = require("path");
const { dbGet, dbAll, dbRun } = require("../db/dbHelpers");

const CACHE_DIR = path.join(__dirname, "../../cache/audio");
const MAX_CACHE_BYTES = parseInt(process.env.AUDIO_CACHE_MAX_MB || "2048", 10) * 1024 * 1024;

function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCachePath(checksum) {
    return path.join(CACHE_DIR, `${checksum}.audio`);
}

async function getEntry(checksum) {
    return dbGet("SELECT * FROM cache_entries WHERE checksum = ?", checksum);
}

async function touchEntry(checksum) {
    await dbRun("UPDATE cache_entries SET last_accessed = CURRENT_TIMESTAMP WHERE checksum = ?", checksum);
}

async function insertEntry(checksum, filePath, fileSize) {
    await dbRun(`
        INSERT OR REPLACE INTO cache_entries (checksum, file_path, file_size, last_accessed)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, checksum, filePath, fileSize);
}

async function removeEntry(checksum) {
    const entry = await dbGet("SELECT file_path FROM cache_entries WHERE checksum = ?", checksum);
    if (entry && fs.existsSync(entry.file_path)) {
        try { fs.unlinkSync(entry.file_path); } catch {}
    }
    await dbRun("DELETE FROM cache_entries WHERE checksum = ?", checksum);
}

async function getTotalCacheSize() {
    const row = await dbGet("SELECT COALESCE(SUM(file_size), 0) as total FROM cache_entries");
    return row.total;
}

async function evictLRU(targetBytes) {
    let currentSize = await getTotalCacheSize();
    while (currentSize > targetBytes) {
        const oldest = await dbGet("SELECT checksum, file_size FROM cache_entries ORDER BY last_accessed ASC LIMIT 1");
        if (!oldest) break;
        await removeEntry(oldest.checksum);
        currentSize -= oldest.file_size;
    }
}

async function initCache() {
    ensureCacheDir();
    const entries = await dbAll("SELECT * FROM cache_entries");
    let removed = 0;
    for (const entry of entries) {
        if (!fs.existsSync(entry.file_path)) {
            await dbRun("DELETE FROM cache_entries WHERE checksum = ?", entry.checksum);
            removed++;
        }
    }
    if (removed > 0) {
        console.log(`[AudioCache] Cleaned ${removed} stale entries`);
    }
    const totalMB = ((await getTotalCacheSize()) / 1024 / 1024).toFixed(1);
    console.log(`[AudioCache] Initialized: ${entries.length - removed} entries, ${totalMB}MB cached`);
}

async function getCachedStream(checksum) {
    const entry = await getEntry(checksum);
    if (!entry) return null;
    if (!fs.existsSync(entry.file_path)) {
        await removeEntry(checksum);
        return null;
    }
    await touchEntry(checksum);
    const stat = fs.statSync(entry.file_path);
    return {
        stream: fs.createReadStream(entry.file_path),
        fileSize: stat.size,
    };
}

async function storeToCache(checksum, data) {
    ensureCacheDir();
    const cachePath = getCachePath(checksum);
    const newSize = Buffer.isBuffer(data) ? data.length : data.byteLength;
    const existing = await getEntry(checksum);
    const requiredSpace = Math.max(0, newSize - (existing?.file_size || 0));
    const totalSize = await getTotalCacheSize();
    if (totalSize + requiredSpace > MAX_CACHE_BYTES) {
        await evictLRU(MAX_CACHE_BYTES - newSize);
    }
    fs.writeFileSync(cachePath, data);
    await insertEntry(checksum, cachePath, newSize);
    return cachePath;
}

async function getCacheStats() {
    const row = await dbGet("SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize FROM cache_entries");
    return {
        entries: row.count,
        totalBytes: row.totalSize,
        totalMB: (row.totalSize / 1024 / 1024).toFixed(1),
        maxMB: MAX_CACHE_BYTES / 1024 / 1024,
        cacheDir: CACHE_DIR,
    };
}

async function clearCache() {
    const entries = await dbAll("SELECT checksum FROM cache_entries");
    for (const entry of entries) {
        await removeEntry(entry.checksum);
    }
    console.log(`[AudioCache] Cleared ${entries.length} entries`);
}

async function removeChecksum(checksum) {
    await removeEntry(checksum);
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
