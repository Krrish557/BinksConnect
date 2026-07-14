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
    `);
}

module.exports = { getDatabase };
