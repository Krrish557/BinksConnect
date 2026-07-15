const Database = require("better-sqlite3");
const crypto = require("crypto");

function generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString("hex");
    return `${prefix}_${timestamp}${random}`;
}

const SCHEMA = `
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
        album_artist_id INTEGER,
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

const FTS5 = `
    CREATE VIRTUAL TABLE IF NOT EXISTS tracks_fts USING fts5(title, artist, album);
    CREATE VIRTUAL TABLE IF NOT EXISTS artists_fts USING fts5(name);
    CREATE VIRTUAL TABLE IF NOT EXISTS albums_fts USING fts5(name);
`;

const TABLES_TO_CLEAR = [
    "playlist_tracks", "playlists", "smart_playlists",
    "favourite_artists", "favourite_albums", "favorites",
    "lyrics_cache", "track_artists", "play_history",
    "provider_mappings", "tracks", "albums", "artists",
    "album_covers", "artist_covers", "sessions", "users",
];

function createTestDb() {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA);
    try { db.exec(FTS5); } catch {}
    return db;
}

function clearDb(db) {
    for (const table of TABLES_TO_CLEAR) {
        db.exec(`DELETE FROM ${table}`);
    }
}

function seedTestData(db) {
    const userId = 1;
    db.prepare("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)").run(userId, "testuser", "hash");

    const sessionId = "sess_test123";
    db.prepare("INSERT INTO sessions (id, user_id, provider_id, provider_config) VALUES (?, ?, ?, ?)").run(
        sessionId, userId, "telegram", JSON.stringify({ id: userId, username: "testuser" })
    );

    const artistId1 = db.prepare("INSERT INTO artists (internal_id, name) VALUES (?, ?)").run("art_aaa111", "Artist One").lastInsertRowid;
    const artistId2 = db.prepare("INSERT INTO artists (internal_id, name) VALUES (?, ?)").run("art_bbb222", "Artist Two").lastInsertRowid;

    const albumId1 = db.prepare("INSERT INTO albums (internal_id, name, artist_id, year) VALUES (?, ?, ?, ?)").run("alb_ccc333", "Album One", artistId1, 2024).lastInsertRowid;
    const albumId2 = db.prepare("INSERT INTO albums (internal_id, name, artist_id, year) VALUES (?, ?, ?, ?)").run("alb_ddd444", "Album Two", artistId2, 2023).lastInsertRowid;

    const trackId1 = db.prepare("INSERT INTO tracks (internal_id, title, artist_id, album_id, duration, track_number) VALUES (?, ?, ?, ?, ?, ?)").run("trk_eee555", "Song Alpha", artistId1, albumId1, 210, 1).lastInsertRowid;
    const trackId2 = db.prepare("INSERT INTO tracks (internal_id, title, artist_id, album_id, duration, track_number) VALUES (?, ?, ?, ?, ?, ?)").run("trk_fff666", "Song Beta", artistId1, albumId1, 180, 2).lastInsertRowid;
    const trackId3 = db.prepare("INSERT INTO tracks (internal_id, title, artist_id, album_id, duration, track_number) VALUES (?, ?, ?, ?, ?, ?)").run("trk_ggg777", "Song Gamma", artistId2, albumId2, 240, 1).lastInsertRowid;

    try {
        db.prepare("INSERT INTO tracks_fts(rowid, title, artist, album) VALUES (?, ?, ?, ?)").run(trackId1, "Song Alpha", "Artist One", "Album One");
        db.prepare("INSERT INTO tracks_fts(rowid, title, artist, album) VALUES (?, ?, ?, ?)").run(trackId2, "Song Beta", "Artist One", "Album One");
        db.prepare("INSERT INTO tracks_fts(rowid, title, artist, album) VALUES (?, ?, ?, ?)").run(trackId3, "Song Gamma", "Artist Two", "Album Two");
        db.prepare("INSERT INTO artists_fts(rowid, name) VALUES (?, ?)").run(artistId1, "Artist One");
        db.prepare("INSERT INTO artists_fts(rowid, name) VALUES (?, ?)").run(artistId2, "Artist Two");
        db.prepare("INSERT INTO albums_fts(rowid, name) VALUES (?, ?)").run(albumId1, "Album One");
        db.prepare("INSERT INTO albums_fts(rowid, name) VALUES (?, ?)").run(albumId2, "Album Two");
    } catch {}

    db.prepare("INSERT INTO lyrics_cache (track_id, provider, synced, plain, synced_json) VALUES (?, ?, 0, ?, NULL)").run(trackId1, "test", "Hello lyrics for Song Alpha");

    return {
        userId, sessionId,
        artistId1: "art_aaa111", artistId2: "art_bbb222",
        albumId1: "alb_ccc333", albumId2: "alb_ddd444",
        trackId1: "trk_eee555", trackId2: "trk_fff666", trackId3: "trk_ggg777",
        dbArtistId1: artistId1, dbArtistId2: artistId2,
        dbAlbumId1: albumId1, dbAlbumId2: albumId2,
        dbTrackId1: trackId1, dbTrackId2: trackId2, dbTrackId3: trackId3,
    };
}

module.exports = { createTestDb, clearDb, seedTestData, generateId };
