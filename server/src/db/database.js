const path = require("path");

const DB_PATH = path.join(__dirname, "binksconnect.db");

const SCHEMA_SQL = `
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
    CREATE TABLE IF NOT EXISTS lyrics_cache (
        track_id INTEGER PRIMARY KEY,
        provider TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        plain TEXT,
        synced_json TEXT,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        internal_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS playlist_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER NOT NULL,
        track_id INTEGER NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
        UNIQUE(playlist_id, track_id)
    );
    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
    CREATE TABLE IF NOT EXISTS favourite_artists (
        user_id INTEGER NOT NULL,
        artist_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, artist_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS favourite_albums (
        user_id INTEGER NOT NULL,
        album_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, album_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS smart_playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        internal_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        rule_limit INTEGER DEFAULT 50,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`;

const FTS5_SQL = `
    CREATE VIRTUAL TABLE IF NOT EXISTS tracks_fts USING fts5(
        title, artist, album,
        content='tracks',
        content_rowid='id'
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS artists_fts USING fts5(
        name,
        content='artists',
        content_rowid='id'
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS albums_fts USING fts5(
        name,
        content='albums',
        content_rowid='id'
    );
`;

const FTS5_SEED_SQL = `
    INSERT OR IGNORE INTO tracks_fts(rowid, title, artist, album)
    SELECT t.id, t.title, COALESCE(ar.name, ''), COALESCE(a.name, '')
    FROM tracks t
    LEFT JOIN artists ar ON ar.id = t.artist_id
    LEFT JOIN albums a ON a.id = t.album_id;
    INSERT OR IGNORE INTO artists_fts(rowid, name)
    SELECT id, name FROM artists;
    INSERT OR IGNORE INTO albums_fts(rowid, name)
    SELECT id, name FROM albums;
`;

const FTS5_TRIGGERS_SQL = `
    CREATE TRIGGER IF NOT EXISTS tracks_ai AFTER INSERT ON tracks BEGIN
        INSERT INTO tracks_fts(rowid, title, artist, album)
        VALUES (new.id, new.title,
            COALESCE((SELECT name FROM artists WHERE id = new.artist_id), ''),
            COALESCE((SELECT name FROM albums WHERE id = new.album_id), ''));
    END;
    CREATE TRIGGER IF NOT EXISTS tracks_ad AFTER DELETE ON tracks BEGIN
        INSERT INTO tracks_fts(tracks_fts, rowid, title, artist, album)
        VALUES ('delete', old.id, old.title,
            COALESCE((SELECT name FROM artists WHERE id = old.artist_id), ''),
            COALESCE((SELECT name FROM albums WHERE id = old.album_id), ''));
    END;
    CREATE TRIGGER IF NOT EXISTS tracks_au AFTER UPDATE ON tracks BEGIN
        INSERT INTO tracks_fts(tracks_fts, rowid, title, artist, album)
        VALUES ('delete', old.id, old.title,
            COALESCE((SELECT name FROM artists WHERE id = old.artist_id), ''),
            COALESCE((SELECT name FROM albums WHERE id = old.album_id), ''));
        INSERT INTO tracks_fts(rowid, title, artist, album)
        VALUES (new.id, new.title,
            COALESCE((SELECT name FROM artists WHERE id = new.artist_id), ''),
            COALESCE((SELECT name FROM albums WHERE id = new.album_id), ''));
    END;
    CREATE TRIGGER IF NOT EXISTS artists_ai AFTER INSERT ON artists BEGIN
        INSERT INTO artists_fts(rowid, name) VALUES (new.id, new.name);
    END;
    CREATE TRIGGER IF NOT EXISTS artists_ad AFTER DELETE ON artists BEGIN
        INSERT INTO artists_fts(artists_fts, rowid, name) VALUES ('delete', old.id, old.name);
    END;
    CREATE TRIGGER IF NOT EXISTS artists_au AFTER UPDATE ON artists BEGIN
        INSERT INTO artists_fts(artists_fts, rowid, name) VALUES ('delete', old.id, old.name);
        INSERT INTO artists_fts(rowid, name) VALUES (new.id, new.name);
    END;
    CREATE TRIGGER IF NOT EXISTS albums_ai AFTER INSERT ON albums BEGIN
        INSERT INTO albums_fts(rowid, name) VALUES (new.id, new.name);
    END;
    CREATE TRIGGER IF NOT EXISTS albums_ad AFTER DELETE ON albums BEGIN
        INSERT INTO albums_fts(albums_fts, rowid, name) VALUES ('delete', old.id, old.name);
    END;
    CREATE TRIGGER IF NOT EXISTS albums_au AFTER UPDATE ON albums BEGIN
        INSERT INTO albums_fts(albums_fts, rowid, name) VALUES ('delete', old.id, old.name);
        INSERT INTO albums_fts(rowid, name) VALUES (new.id, new.name);
    END;
`;

let backend = null;

function getDatabase() {
    if (!backend) {
        if (process.env.TURSO_DATABASE_URL) {
            const { createClient } = require("@libsql/client");
            const client = createClient({
                url: process.env.TURSO_DATABASE_URL,
                authToken: process.env.TURSO_AUTH_TOKEN,
            });
            backend = { type: "turso", client };
        } else {
            const Database = require("better-sqlite3");
            const db = new Database(DB_PATH);
            db.pragma("journal_mode = WAL");
            db.pragma("foreign_keys = ON");
            backend = { type: "sqlite", client: db };
            initSchemaSqlite(db);
        }
    }
    return backend;
}

async function initDatabase() {
    const { type, client } = getDatabase();
    if (type === "turso") {
        await initSchemaTurso(client);
    }
}

function initSchemaSqlite(db) {
    db.exec(SCHEMA_SQL);
    initFTS5Sqlite(db);
    runMigrationsSqlite(db);
}

function initFTS5Sqlite(db) {
    try {
        db.exec(FTS5_SQL);
        const hasFtsMigration = db.prepare("SELECT 1 FROM schema_migrations WHERE name = ?").get("fts5_init");
        if (!hasFtsMigration) {
            db.exec(FTS5_SEED_SQL);
            db.exec(FTS5_TRIGGERS_SQL);
            db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run("fts5_init");
            console.log("[DB] FTS5 initialized");
        }
    } catch (err) {
        console.warn("[DB] FTS5 not available, falling back to LIKE:", err.message);
    }
}

function runMigrationsSqlite(db) {
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

        const tracks = db.prepare(`
            SELECT t.id, t.artist_id, ar.name as artist_name
            FROM tracks t LEFT JOIN artists ar ON ar.id = t.artist_id
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
                primaryInfo = { dbId: Number(result.lastInsertRowid), internalId: null };
                nameToId.set(primaryNorm, primaryInfo);
            }

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
                    featInfo = { dbId: Number(result.lastInsertRowid), internalId: null };
                    nameToId.set(featNorm, featInfo);
                }
                insertJunction.run(track.id, featInfo.dbId, "featured");
            }
        }

        const albums = db.prepare(`
            SELECT a.id, a.artist_id, ar.name as artist_name
            FROM albums a LEFT JOIN artists ar ON ar.id = a.artist_id
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

async function initSchemaTurso(client) {
    await client.executeMultiple(SCHEMA_SQL);

    try {
        await client.executeMultiple(FTS5_SQL);
        const hasFtsMigration = await client.execute({
            sql: "SELECT 1 FROM schema_migrations WHERE name = ?",
            args: ["fts5_init"],
        });
        if (hasFtsMigration.rows.length === 0) {
            await client.executeMultiple(FTS5_SEED_SQL);
            await client.executeMultiple(FTS5_TRIGGERS_SQL);
            await client.execute({
                sql: "INSERT INTO schema_migrations (name) VALUES (?)",
                args: ["fts5_init"],
            });
            console.log("[DB] FTS5 initialized");
        }
    } catch (err) {
        console.warn("[DB] FTS5 not available, falling back to LIKE:", err.message);
    }

    const hasMigration = await client.execute({
        sql: "SELECT 1 FROM schema_migrations WHERE name = ?",
        args: ["artist_normalization"],
    });
    if (hasMigration.rows.length > 0) return;

    console.log("[DB] Running artist_normalization migration (Turso)...");

    const columnsResult = await client.execute("PRAGMA table_info(tracks)");
    const hasAlbumArtist = columnsResult.rows.some((c) => c.name === "album_artist_id");
    if (!hasAlbumArtist) {
        await client.execute("ALTER TABLE tracks ADD COLUMN album_artist_id INTEGER REFERENCES artists(id)");
    }

    const { parseArtists, normalizeArtistName } = require("../utils/artistParser");
    const { generateId } = require("./ids");

    await client.execute("BEGIN");
    try {
        const artistsResult = await client.execute("SELECT id, internal_id, name FROM artists");
        const nameToId = new Map();
        const dupes = [];

        for (const artist of artistsResult.rows) {
            const norm = normalizeArtistName(artist.name);
            if (nameToId.has(norm)) {
                dupes.push({ oldId: artist.id, oldInternalId: artist.internal_id, targetId: nameToId.get(norm) });
            } else {
                nameToId.set(norm, { dbId: artist.id, internalId: artist.internal_id });
            }
        }

        for (const dupe of dupes) {
            await client.execute({ sql: "UPDATE tracks SET artist_id = ? WHERE artist_id = ?", args: [dupe.targetId.dbId, dupe.oldId] });
            await client.execute({ sql: "UPDATE tracks SET album_artist_id = ? WHERE album_artist_id = ?", args: [dupe.targetId.dbId, dupe.oldId] });
            await client.execute({ sql: "UPDATE albums SET artist_id = ? WHERE artist_id = ?", args: [dupe.targetId.dbId, dupe.oldId] });
            await client.execute({ sql: "DELETE FROM artist_covers WHERE artist_id = ?", args: [dupe.oldId] });
            await client.execute({ sql: "DELETE FROM artists WHERE id = ?", args: [dupe.oldId] });
        }

        const tracksResult = await client.execute(`
            SELECT t.id, t.artist_id, ar.name as artist_name
            FROM tracks t LEFT JOIN artists ar ON ar.id = t.artist_id
        `);

        for (const track of tracksResult.rows) {
            if (!track.artist_name) continue;
            const parsed = parseArtists(track.artist_name);
            if (parsed.length === 0) continue;

            const primaryName = parsed[0];
            const primaryNorm = normalizeArtistName(primaryName);
            let primaryInfo = nameToId.get(primaryNorm);
            if (!primaryInfo) {
                const internalId = generateId("art");
                const result = await client.execute({
                    sql: "INSERT INTO artists (internal_id, name) VALUES (?, ?)",
                    args: [internalId, primaryName],
                });
                primaryInfo = { dbId: Number(result.lastInsertRowid), internalId };
                nameToId.set(primaryNorm, primaryInfo);
            }

            if (track.artist_id !== primaryInfo.dbId) {
                await client.execute({ sql: "UPDATE tracks SET artist_id = ? WHERE id = ?", args: [primaryInfo.dbId, track.id] });
            }
            await client.execute({ sql: "UPDATE tracks SET album_artist_id = ? WHERE id = ? AND album_artist_id IS NULL", args: [primaryInfo.dbId, track.id] });
            await client.execute({
                sql: "INSERT OR IGNORE INTO track_artists (track_id, artist_id, role) VALUES (?, ?, ?)",
                args: [track.id, primaryInfo.dbId, "primary"],
            });

            for (let i = 1; i < parsed.length; i++) {
                const featName = parsed[i];
                const featNorm = normalizeArtistName(featName);
                let featInfo = nameToId.get(featNorm);
                if (!featInfo) {
                    const internalId = generateId("art");
                    const result = await client.execute({
                        sql: "INSERT INTO artists (internal_id, name) VALUES (?, ?)",
                        args: [internalId, featName],
                    });
                    featInfo = { dbId: Number(result.lastInsertRowid), internalId };
                    nameToId.set(featNorm, featInfo);
                }
                await client.execute({
                    sql: "INSERT OR IGNORE INTO track_artists (track_id, artist_id, role) VALUES (?, ?, ?)",
                    args: [track.id, featInfo.dbId, "featured"],
                });
            }
        }

        const albumsResult = await client.execute(`
            SELECT a.id, a.artist_id, ar.name as artist_name
            FROM albums a LEFT JOIN artists ar ON ar.id = a.artist_id
        `);

        for (const album of albumsResult.rows) {
            if (!album.artist_name) continue;
            const primaryName = parseArtists(album.artist_name)[0];
            if (!primaryName) continue;
            const primaryNorm = normalizeArtistName(primaryName);
            const primaryInfo = nameToId.get(primaryNorm);
            if (primaryInfo && primaryInfo.dbId !== album.artist_id) {
                await client.execute({ sql: "UPDATE albums SET artist_id = ? WHERE id = ?", args: [primaryInfo.dbId, album.id] });
            }
        }

        const allAlbumsResult = await client.execute(`
            SELECT a.id, a.name, a.artist_id,
                   (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as trackCount
            FROM albums a ORDER BY a.name, a.artist_id
        `);

        const albumGroups = new Map();
        for (const a of allAlbumsResult.rows) {
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
                    await client.execute({ sql: "UPDATE tracks SET album_id = ? WHERE album_id = ?", args: [keep.id, dup.id] });
                }
                const dupCoverResult = await client.execute({ sql: "SELECT * FROM album_covers WHERE album_id = ?", args: [dup.id] });
                if (dupCoverResult.rows.length > 0) {
                    const dupCover = dupCoverResult.rows[0];
                    const keepCoverResult = await client.execute({ sql: "SELECT 1 FROM album_covers WHERE album_id = ?", args: [keep.id] });
                    if (keepCoverResult.rows.length === 0) {
                        await client.execute({
                            sql: "INSERT OR REPLACE INTO album_covers (album_id, thumbnail, full_size, mime_type) VALUES (?, ?, ?, ?)",
                            args: [keep.id, dupCover.thumbnail, dupCover.full_size, dupCover.mime_type],
                        });
                    }
                    await client.execute({ sql: "DELETE FROM album_covers WHERE album_id = ?", args: [dup.id] });
                }
                await client.execute({ sql: "DELETE FROM albums WHERE id = ?", args: [dup.id] });
            }
        }

        const allArtResult = await client.execute("SELECT id, name FROM artists");
        for (const a of allArtResult.rows) {
            if (parseArtists(a.name).length <= 1) continue;
            const tcResult = await client.execute({ sql: "SELECT COUNT(*) as c FROM tracks WHERE artist_id = ?", args: [a.id] });
            const trackCount = tcResult.rows[0].c;
            const acResult = await client.execute({ sql: "SELECT COUNT(*) as c FROM albums WHERE artist_id = ?", args: [a.id] });
            const albumCount = acResult.rows[0].c;
            if (trackCount === 0 && albumCount === 0) {
                await client.execute({ sql: "DELETE FROM track_artists WHERE artist_id = ?", args: [a.id] });
                await client.execute({ sql: "DELETE FROM artist_covers WHERE artist_id = ?", args: [a.id] });
                await client.execute({ sql: "DELETE FROM artists WHERE id = ?", args: [a.id] });
            }
        }

        const artistsNoCoverResult = await client.execute(`
            SELECT a.id FROM artists a
            LEFT JOIN artist_covers ac ON ac.artist_id = a.id
            WHERE ac.artist_id IS NULL
        `);

        for (const { id } of artistsNoCoverResult.rows) {
            let coverResult = await client.execute({
                sql: `SELECT ac.thumbnail, ac.full_size, ac.mime_type
                    FROM tracks t
                    JOIN album_covers ac ON ac.album_id = t.album_id
                    WHERE t.artist_id = ?
                    ORDER BY t.created_at DESC LIMIT 1`,
                args: [id],
            });
            let cover = coverResult.rows[0] || null;

            if (!cover) {
                coverResult = await client.execute({
                    sql: `SELECT ac.thumbnail, ac.full_size, ac.mime_type
                        FROM track_artists ta
                        JOIN tracks t ON t.id = ta.track_id
                        JOIN album_covers ac ON ac.album_id = t.album_id
                        WHERE ta.artist_id = ?
                        ORDER BY t.created_at DESC LIMIT 1`,
                    args: [id],
                });
                cover = coverResult.rows[0] || null;
            }

            if (cover) {
                await client.execute({
                    sql: "INSERT OR REPLACE INTO artist_covers (artist_id, thumbnail, full_size, mime_type) VALUES (?, ?, ?, ?)",
                    args: [id, cover.thumbnail, cover.full_size, cover.mime_type],
                });
            }
        }

        await client.execute("COMMIT");
    } catch (err) {
        await client.execute("ROLLBACK");
        throw err;
    }

    await client.execute({
        sql: "INSERT INTO schema_migrations (name) VALUES (?)",
        args: ["artist_normalization"],
    });
    console.log("[DB] artist_normalization migration complete (Turso)");
}

module.exports = { getDatabase, initDatabase };
