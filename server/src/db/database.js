const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "binksconnect.db");

let db;

function getDatabase() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma("journal_mode = WAL");
        db.pragma("foreign_keys = ON");
        initSchema();
    }
    return db;
}

function initSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            provider_id TEXT NOT NULL,
            provider_config TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS artists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            internal_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            cover_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            internal_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            artist_id INTEGER,
            year INTEGER DEFAULT 0,
            cover_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            internal_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            artist_id INTEGER,
            album_id INTEGER,
            duration REAL DEFAULT 0,
            genre TEXT,
            year INTEGER,
            track_number INTEGER,
            bitrate INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
            FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS provider_mappings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER NOT NULL,
            provider TEXT NOT NULL,
            provider_track_id TEXT,
            telegram_channel_id TEXT,
            telegram_message_id INTEGER,
            telegram_file_id TEXT,
            telegram_file_unique_id TEXT,
            file_name TEXT,
            file_size INTEGER,
            mime_type TEXT,
            checksum TEXT,
            uploaded_by TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS telegram_channels (
            channel_id TEXT PRIMARY KEY,
            title TEXT,
            is_active INTEGER DEFAULT 1,
            strategy TEXT DEFAULT 'round_robin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS favorites (
            user_id INTEGER NOT NULL,
            track_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, track_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS play_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            track_id INTEGER NOT NULL,
            played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
        CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
        CREATE INDEX IF NOT EXISTS idx_provider_mappings_track ON provider_mappings(track_id);
        CREATE INDEX IF NOT EXISTS idx_provider_mappings_checksum ON provider_mappings(checksum);
        CREATE INDEX IF NOT EXISTS idx_play_history_user ON play_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_play_history_track ON play_history(track_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

        CREATE TABLE IF NOT EXISTS cache_entries (
            checksum TEXT PRIMARY KEY,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS album_covers (
            album_id INTEGER PRIMARY KEY,
            thumbnail BLOB,
            full_size BLOB,
            mime_type TEXT DEFAULT 'image/jpeg',
            FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS artist_covers (
            artist_id INTEGER PRIMARY KEY,
            thumbnail BLOB,
            full_size BLOB,
            mime_type TEXT DEFAULT 'image/jpeg',
            FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS track_artists (
            track_id INTEGER NOT NULL,
            artist_id INTEGER NOT NULL,
            role TEXT DEFAULT 'primary',
            PRIMARY KEY (track_id, artist_id),
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
            FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_track_artists_artist ON track_artists(artist_id);
    `);

    runMigrations();
}

function runMigrations() {
    const hasMigration = db.prepare("SELECT 1 FROM schema_migrations WHERE name = ?").get("artist_normalization");
    if (hasMigration) return;

    console.log("[DB] Running artist_normalization migration...");

    const columns = db.prepare("PRAGMA table_info(tracks)").all();
    const hasAlbumArtist = columns.some((c) => c.name === "album_artist_id");
    if (!hasAlbumArtist) {
        db.exec("ALTER TABLE tracks ADD COLUMN album_artist_id INTEGER REFERENCES artists(id)");
    }

    const { parseArtists, normalizeArtistName } = require("../utils/artistParser");
    const { generateId } = require("./ids");

    const migrate = db.transaction(() => {
        // Step 1: Deduplicate artists with same normalized name
        const artists = db.prepare("SELECT id, internal_id, name FROM artists").all();
        const nameToId = new Map();
        const dupes = [];

        for (const artist of artists) {
            const norm = normalizeArtistName(artist.name);
            if (nameToId.has(norm)) {
                dupes.push({ oldId: artist.id, oldInternalId: artist.internal_id, targetId: nameToId.get(norm) });
            } else {
                nameToId.set(norm, { dbId: artist.id, internalId: artist.internal_id });
            }
        }

        for (const dupe of dupes) {
            db.prepare("UPDATE tracks SET artist_id = ? WHERE artist_id = ?").run(dupe.targetId.dbId, dupe.oldId);
            db.prepare("UPDATE tracks SET album_artist_id = ? WHERE album_artist_id = ?").run(dupe.targetId.dbId, dupe.oldId);
            db.prepare("UPDATE albums SET artist_id = ? WHERE artist_id = ?").run(dupe.targetId.dbId, dupe.oldId);
            db.prepare("DELETE FROM artist_covers WHERE artist_id = ?").run(dupe.oldId);
            db.prepare("DELETE FROM artists WHERE id = ?").run(dupe.oldId);
        }

        // Step 2: Parse combined artist names, reassign tracks, create junction entries
        const tracks = db.prepare(`
            SELECT t.id, t.artist_id, ar.name as artist_name
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
        `).all();

        const insertJunction = db.prepare("INSERT OR IGNORE INTO track_artists (track_id, artist_id, role) VALUES (?, ?, ?)");
        const insertArtist = db.prepare("INSERT INTO artists (internal_id, name) VALUES (?, ?)");

        for (const track of tracks) {
            if (!track.artist_name) continue;

            const parsed = parseArtists(track.artist_name);
            if (parsed.length === 0) continue;

            const primaryName = parsed[0];
            const primaryNorm = normalizeArtistName(primaryName);

            let primaryInfo = nameToId.get(primaryNorm);
            if (!primaryInfo) {
                const result = insertArtist.run(generateId("art"), primaryName);
                primaryInfo = { dbId: result.lastInsertRowid, internalId: null };
                nameToId.set(primaryNorm, primaryInfo);
            }

            // Reassign artist_id if pointing to a combined name
            if (track.artist_id !== primaryInfo.dbId) {
                db.prepare("UPDATE tracks SET artist_id = ? WHERE id = ?").run(primaryInfo.dbId, track.id);
            }
            db.prepare("UPDATE tracks SET album_artist_id = ? WHERE id = ? AND album_artist_id IS NULL").run(primaryInfo.dbId, track.id);
            insertJunction.run(track.id, primaryInfo.dbId, "primary");

            for (let i = 1; i < parsed.length; i++) {
                const featName = parsed[i];
                const featNorm = normalizeArtistName(featName);

                let featInfo = nameToId.get(featNorm);
                if (!featInfo) {
                    const result = insertArtist.run(generateId("art"), featName);
                    featInfo = { dbId: result.lastInsertRowid, internalId: null };
                    nameToId.set(featNorm, featInfo);
                }

                insertJunction.run(track.id, featInfo.dbId, "featured");
            }
        }

        // Step 3: Fix album artist_id
        const albums = db.prepare(`
            SELECT a.id, a.artist_id, ar.name as artist_name
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
        `).all();

        for (const album of albums) {
            if (!album.artist_name) continue;
            const primaryName = parseArtists(album.artist_name)[0];
            if (!primaryName) continue;
            const primaryNorm = normalizeArtistName(primaryName);
            const primaryInfo = nameToId.get(primaryNorm);
            if (primaryInfo && primaryInfo.dbId !== album.artist_id) {
                db.prepare("UPDATE albums SET artist_id = ? WHERE id = ?").run(primaryInfo.dbId, album.id);
            }
        }

        // Step 4: Merge duplicate albums (same name + same artist_id)
        const allAlbums = db.prepare(`
            SELECT a.id, a.name, a.artist_id,
                   (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as trackCount
            FROM albums a ORDER BY a.name, a.artist_id
        `).all();

        const albumGroups = new Map();
        for (const a of allAlbums) {
            const key = (a.name || "").toLowerCase().trim() + "|" + (a.artist_id || 0);
            if (!albumGroups.has(key)) albumGroups.set(key, []);
            albumGroups.get(key).push(a);
        }

        for (const [, group] of albumGroups) {
            if (group.length <= 1) continue;
            group.sort((a, b) => b.trackCount - a.trackCount);
            const keep = group[0];
            for (let i = 1; i < group.length; i++) {
                const dup = group[i];
                if (dup.trackCount > 0) {
                    db.prepare("UPDATE tracks SET album_id = ? WHERE album_id = ?").run(keep.id, dup.id);
                }
                const dupCover = db.prepare("SELECT * FROM album_covers WHERE album_id = ?").get(dup.id);
                if (dupCover) {
                    const keepCover = db.prepare("SELECT 1 FROM album_covers WHERE album_id = ?").get(keep.id);
                    if (!keepCover) {
                        db.prepare("INSERT OR REPLACE INTO album_covers (album_id, thumbnail, full_size, mime_type) VALUES (?, ?, ?, ?)").run(
                            keep.id, dupCover.thumbnail, dupCover.full_size, dupCover.mime_type
                        );
                    }
                    db.prepare("DELETE FROM album_covers WHERE album_id = ?").run(dup.id);
                }
                db.prepare("DELETE FROM albums WHERE id = ?").run(dup.id);
            }
        }

        // Step 4: Delete orphaned combined artist records
        const allArt = db.prepare("SELECT id, name FROM artists").all();
        for (const a of allArt) {
            if (parseArtists(a.name).length <= 1) continue;
            const trackCount = db.prepare("SELECT COUNT(*) as c FROM tracks WHERE artist_id = ?").get(a.id).c;
            const albumCount = db.prepare("SELECT COUNT(*) as c FROM albums WHERE artist_id = ?").get(a.id).c;
            if (trackCount === 0 && albumCount === 0) {
                db.prepare("DELETE FROM track_artists WHERE artist_id = ?").run(a.id);
                db.prepare("DELETE FROM artist_covers WHERE artist_id = ?").run(a.id);
                db.prepare("DELETE FROM artists WHERE id = ?").run(a.id);
            }
        }

        // Step 5: Set artist covers from most recent album cover
        const artistsNoCover = db.prepare(`
            SELECT a.id FROM artists a
            LEFT JOIN artist_covers ac ON ac.artist_id = a.id
            WHERE ac.artist_id IS NULL
        `).all();

        for (const { id } of artistsNoCover) {
            let cover = db.prepare(`
                SELECT ac.thumbnail, ac.full_size, ac.mime_type
                FROM tracks t
                JOIN album_covers ac ON ac.album_id = t.album_id
                WHERE t.artist_id = ?
                ORDER BY t.created_at DESC LIMIT 1
            `).get(id);

            if (!cover) {
                cover = db.prepare(`
                    SELECT ac.thumbnail, ac.full_size, ac.mime_type
                    FROM track_artists ta
                    JOIN tracks t ON t.id = ta.track_id
                    JOIN album_covers ac ON ac.album_id = t.album_id
                    WHERE ta.artist_id = ?
                    ORDER BY t.created_at DESC LIMIT 1
                `).get(id);
            }

            if (cover) {
                db.prepare("INSERT OR REPLACE INTO artist_covers (artist_id, thumbnail, full_size, mime_type) VALUES (?, ?, ?, ?)").run(
                    id, cover.thumbnail, cover.full_size, cover.mime_type
                );
            }
        }
    });

    migrate();
    db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run("artist_normalization");
    console.log("[DB] artist_normalization migration complete");
}

module.exports = { getDatabase };
