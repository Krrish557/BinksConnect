const { getDatabase } = require("../db/database");
const { generateId } = require("../db/ids");

class MetadataService {
    createArtist(name, coverUrl = null) {
        const db = getDatabase();
        const internalId = generateId("art");
        const existing = db.prepare("SELECT id, internal_id FROM artists WHERE name = ?").get(name);
        if (existing) return { id: existing.internal_id, dbId: existing.id };
        const result = db.prepare("INSERT INTO artists (internal_id, name, cover_url) VALUES (?, ?, ?)").run(internalId, name, coverUrl);
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    createAlbum(name, artistDbId, year = 0, coverUrl = null) {
        const db = getDatabase();
        const internalId = generateId("alb");
        const existing = db.prepare("SELECT id, internal_id FROM albums WHERE name = ? AND artist_id = ?").get(name, artistDbId || null);
        if (existing) return { id: existing.internal_id, dbId: existing.id };
        const result = db.prepare("INSERT INTO albums (internal_id, name, artist_id, year, cover_url) VALUES (?, ?, ?, ?, ?)").run(internalId, name, artistDbId || null, year, coverUrl);
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    createTrack(metadata, albumDbId, artistDbId) {
        const db = getDatabase();
        const internalId = generateId("trk");
        const result = db.prepare(`
            INSERT INTO tracks (internal_id, title, artist_id, album_id, duration, genre, year, track_number, bitrate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            internalId,
            metadata.title || "Unknown",
            artistDbId || null,
            albumDbId || null,
            metadata.duration || 0,
            metadata.genre || null,
            metadata.year || null,
            metadata.trackNumber || null,
            metadata.bitrate || null
        );
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    createProviderMapping(trackDbId, provider, fileData) {
        const db = getDatabase();
        const result = db.prepare(`
            INSERT INTO provider_mappings (track_id, provider, provider_track_id, telegram_channel_id, telegram_message_id, telegram_file_id, telegram_file_unique_id, file_name, file_size, mime_type, checksum, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            trackDbId,
            provider,
            fileData.providerTrackId || null,
            fileData.telegramChannelId || null,
            fileData.telegramMessageId || null,
            fileData.telegramFileId || null,
            fileData.telegramFileUnique_id || fileData.telegramFileUniqueId || null,
            fileData.fileName || null,
            fileData.fileSize || null,
            fileData.mimeType || null,
            fileData.checksum || null,
            fileData.uploadedBy || "admin"
        );
        return result.lastInsertRowid;
    }

    findTrackByChecksum(checksum) {
        const db = getDatabase();
        const row = db.prepare(`
            SELECT t.internal_id, t.title, pm.provider
            FROM provider_mappings pm
            JOIN tracks t ON t.id = pm.track_id
            WHERE pm.checksum = ?
            LIMIT 1
        `).get(checksum);
        return row || null;
    }

    findMappingByTrackId(trackInternalId) {
        const db = getDatabase();
        return db.prepare(`
            SELECT pm.*, t.internal_id as track_internal_id
            FROM provider_mappings pm
            JOIN tracks t ON t.id = pm.track_id
            WHERE t.internal_id = ?
        `).all(trackInternalId);
    }

    resolveTrackId(internalId) {
        const db = getDatabase();
        const track = db.prepare("SELECT id FROM tracks WHERE internal_id = ?").get(internalId);
        return track ? track.id : null;
    }

    getAlbums(offset = 0, limit = 50) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId,
                   (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as songCount,
                   (SELECT COALESCE(SUM(duration), 0) FROM tracks WHERE album_id = a.id) as duration
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
            ORDER BY a.name ASC
            LIMIT ? OFFSET ?
        `).all(limit, offset);
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            artist: r.artist || "Unknown",
            artistId: r.artistId,
            year: r.year || 0,
            coverUrl: r.coverUrl || `/api/art/${r.id}`,
            songCount: r.songCount,
            duration: r.duration,
            provider: "telegram",
            songs: undefined,
        }));
    }

    getAlbumTracks(albumInternalId) {
        const db = getDatabase();
        const album = db.prepare(`
            SELECT a.*, ar.name as artist_name, ar.internal_id as artist_internal_id
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE a.internal_id = ?
        `).get(albumInternalId);
        if (!album) return null;

        const songs = db.prepare(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album_name, a.internal_id as albumId
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE t.album_id = ?
            ORDER BY t.track_number ASC, t.title ASC
        `).all(album.id);

        return {
            album: {
                id: album.internal_id,
                name: album.name,
                artist: album.artist_name || "Unknown",
                artistId: album.artist_internal_id,
                year: album.year || 0,
                coverUrl: album.cover_url || `/api/art/${album.internal_id}`,
                songCount: songs.length,
                duration: songs.reduce((sum, s) => sum + (s.duration || 0), 0),
                provider: "telegram",
            },
            songs: songs.map((s) => ({
                id: s.id,
                title: s.title,
                artist: s.artist || "Unknown",
                album: s.album_name,
                albumId: s.albumId,
                duration: s.duration || 0,
                track: s.track || 0,
                cover: `/api/art/${s.albumId}`,
                url: `/api/stream/${s.id}`,
                provider: "telegram",
                metadata: { genre: s.genre, year: s.year },
            })),
        };
    }

    getRecentAlbums(userId, size = 12) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT DISTINCT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId,
                   MAX(ph.played_at) as last_played
            FROM play_history ph
            JOIN tracks t ON t.id = ph.track_id
            JOIN albums a ON a.id = t.album_id
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE ph.user_id = ?
            GROUP BY a.id
            ORDER BY last_played DESC
            LIMIT ?
        `).all(userId, size);
        return rows.map((r) => ({
            id: r.id, name: r.name, artist: r.artist || "Unknown", artistId: r.artistId,
            year: r.year || 0, coverUrl: r.coverUrl || `/api/art/${r.id}`,
            provider: "telegram",
        }));
    }

    getNewestAlbums(size = 12) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
            ORDER BY a.created_at DESC
            LIMIT ?
        `).all(size);
        return rows.map((r) => ({
            id: r.id, name: r.name, artist: r.artist || "Unknown", artistId: r.artistId,
            year: r.year || 0, coverUrl: r.coverUrl || `/api/art/${r.id}`,
            provider: "telegram",
        }));
    }

    getFrequentAlbums(userId, size = 12) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId,
                   COUNT(ph.id) as play_count
            FROM play_history ph
            JOIN tracks t ON t.id = ph.track_id
            JOIN albums a ON a.id = t.album_id
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE ph.user_id = ?
            GROUP BY a.id
            ORDER BY play_count DESC
            LIMIT ?
        `).all(userId, size);
        return rows.map((r) => ({
            id: r.id, name: r.name, artist: r.artist || "Unknown", artistId: r.artistId,
            year: r.year || 0, coverUrl: r.coverUrl || `/api/art/${r.id}`,
            provider: "telegram",
        }));
    }

    getStarredItems(userId) {
        const db = getDatabase();
        const songs = db.prepare(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM favorites f
            JOIN tracks t ON t.id = f.track_id
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE f.user_id = ?
            ORDER BY t.title ASC
        `).all(userId);

        const albumIds = [...new Set(songs.map((s) => s.albumId).filter(Boolean))];
        const albums = albumIds.length > 0
            ? db.prepare(`
                SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                       ar.name as artist, ar.internal_id as artistId
                FROM albums a
                LEFT JOIN artists ar ON ar.id = a.artist_id
                WHERE a.id IN (${albumIds.map(() => "?").join(",")})
            `).all(...albumIds)
            : [];

        return {
            songs: songs.map((s) => ({
                id: s.id, title: s.title, artist: s.artist || "Unknown",
                album: s.album, albumId: s.albumId, duration: s.duration || 0,
                track: s.track || 0, cover: `/api/art/${s.albumId}`,
                url: `/api/stream/${s.id}`, provider: "telegram",
            })),
            albums: albums.map((a) => ({
                id: a.id, name: a.name, artist: a.artist || "Unknown", artistId: a.artistId,
                year: a.year || 0, coverUrl: a.coverUrl || `/api/art/${a.id}`,
                provider: "telegram",
            })),
            artists: [],
        };
    }

    getSongs(offset = 0, limit = 50) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            ORDER BY t.title ASC
            LIMIT ? OFFSET ?
        `).all(limit, offset);
        return rows.map((s) => ({
            id: s.id, title: s.title, artist: s.artist || "Unknown",
            album: s.album, albumId: s.albumId, duration: s.duration || 0,
            track: s.track || 0, cover: `/api/art/${s.albumId}`,
            url: `/api/stream/${s.id}`, provider: "telegram",
        }));
    }

    getRandomSongs(size = 20) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            ORDER BY RANDOM()
            LIMIT ?
        `).all(size);
        return rows.map((s) => ({
            id: s.id, title: s.title, artist: s.artist || "Unknown",
            album: s.album, albumId: s.albumId, duration: s.duration || 0,
            track: s.track || 0, cover: `/api/art/${s.albumId}`,
            url: `/api/stream/${s.id}`, provider: "telegram",
        }));
    }

    getArtists() {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT ar.internal_id as id, ar.name, ar.cover_url as coverArt,
                   (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount
            FROM artists ar
            ORDER BY ar.name ASC
        `).all();
        return rows.map((a) => ({
            id: a.id, name: a.name, albumCount: a.albumCount,
            coverArt: a.coverArt, provider: "telegram",
        }));
    }

    getArtist(artistInternalId) {
        const db = getDatabase();
        const artist = db.prepare("SELECT * FROM artists WHERE internal_id = ?").get(artistInternalId);
        if (!artist) return null;

        const albums = db.prepare(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as songCount,
                   (SELECT COALESCE(SUM(duration), 0) FROM tracks WHERE album_id = a.id) as duration
            FROM albums a
            WHERE a.artist_id = ?
            ORDER BY a.year ASC, a.name ASC
        `).all(artist.id);

        return {
            id: artist.internal_id,
            name: artist.name,
            albumCount: albums.length,
            coverArt: artist.cover_url,
            provider: "telegram",
            album: albums.map((a) => ({
                id: a.id, name: a.name, artist: artist.name,
                artistId: artist.internal_id, year: a.year || 0,
                coverUrl: a.coverUrl || `/api/art/${a.id}`,
                songCount: a.songCount, duration: a.duration,
                provider: "telegram",
            })),
        };
    }

    search(query) {
        const db = getDatabase();
        const q = `%${query}%`;

        const songs = db.prepare(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE t.title LIKE ? OR ar.name LIKE ? OR a.name LIKE ?
            ORDER BY t.title ASC
            LIMIT 20
        `).all(q, q, q);

        const albums = db.prepare(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE a.name LIKE ? OR ar.name LIKE ?
            ORDER BY a.name ASC
            LIMIT 10
        `).all(q, q);

        const artists = db.prepare(`
            SELECT ar.internal_id as id, ar.name, ar.cover_url as coverArt,
                   (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount
            FROM artists ar
            WHERE ar.name LIKE ?
            ORDER BY ar.name ASC
            LIMIT 10
        `).all(q);

        return {
            songs: songs.map((s) => ({
                id: s.id, title: s.title, artist: s.artist || "Unknown",
                album: s.album, albumId: s.albumId, duration: s.duration || 0,
                track: s.track || 0, cover: `/api/art/${s.albumId}`,
                url: `/api/stream/${s.id}`, provider: "telegram",
            })),
            albums: albums.map((a) => ({
                id: a.id, name: a.name, artist: a.artist || "Unknown", artistId: a.artistId,
                year: a.year || 0, coverUrl: a.coverUrl || `/api/art/${a.id}`,
                provider: "telegram",
            })),
            artists: artists.map((a) => ({
                id: a.id, name: a.name, albumCount: a.albumCount,
                coverArt: a.coverArt, provider: "telegram",
            })),
        };
    }

    recordPlay(userId, trackInternalId) {
        const db = getDatabase();
        const trackId = this.resolveTrackId(trackInternalId);
        if (!trackId) return;
        db.prepare("INSERT INTO play_history (user_id, track_id) VALUES (?, ?)").run(userId, trackId);
    }

    toggleFavorite(userId, trackInternalId) {
        const db = getDatabase();
        const trackId = this.resolveTrackId(trackInternalId);
        if (!trackId) return false;
        const existing = db.prepare("SELECT 1 FROM favorites WHERE user_id = ? AND track_id = ?").get(userId, trackId);
        if (existing) {
            db.prepare("DELETE FROM favorites WHERE user_id = ? AND track_id = ?").run(userId, trackId);
            return false;
        } else {
            db.prepare("INSERT INTO favorites (user_id, track_id) VALUES (?, ?)").run(userId, trackId);
            return true;
        }
    }

    getTrackCount() {
        const db = getDatabase();
        const row = db.prepare("SELECT COUNT(*) as count FROM tracks").get();
        return row.count;
    }

    getArtistCount() {
        const db = getDatabase();
        const row = db.prepare("SELECT COUNT(*) as count FROM artists").get();
        return row.count;
    }

    getAlbumCount() {
        const db = getDatabase();
        const row = db.prepare("SELECT COUNT(*) as count FROM albums").get();
        return row.count;
    }
}

module.exports = new MetadataService();
