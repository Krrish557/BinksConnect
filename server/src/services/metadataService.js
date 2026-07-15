const { getDatabase } = require("../db/database");
const { generateId } = require("../db/ids");
const { normalizeArtistName } = require("../utils/artistParser");

class MetadataService {
    createArtist(name, coverUrl = null) {
        const db = getDatabase();
        const internalId = generateId("art");
        const existing = db.prepare("SELECT id, internal_id FROM artists WHERE name = ?").get(name);
        if (existing) return { id: existing.internal_id, dbId: existing.id };
        const result = db.prepare("INSERT INTO artists (internal_id, name, cover_url) VALUES (?, ?, ?)").run(internalId, name, coverUrl);
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    findOrCreateArtist(name, coverUrl = null) {
        if (!name || typeof name !== "string") return null;
        const trimmed = name.trim();
        if (!trimmed) return null;

        const db = getDatabase();
        const norm = normalizeArtistName(trimmed);

        const existing = db.prepare(`
            SELECT id, internal_id FROM artists
            WHERE LOWER(REPLACE(name, ' ', ' ')) = ?
        `).get(norm);

        if (existing) return { id: existing.internal_id, dbId: existing.id };

        const internalId = generateId("art");
        const result = db.prepare("INSERT INTO artists (internal_id, name, cover_url) VALUES (?, ?, ?)").run(internalId, trimmed, coverUrl);
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    linkTrackArtist(trackDbId, artistDbId, role = "primary") {
        const db = getDatabase();
        db.prepare("INSERT OR IGNORE INTO track_artists (track_id, artist_id, role) VALUES (?, ?, ?)").run(trackDbId, artistDbId, role);
    }

    getFeaturedTracks(artistInternalId) {
        const db = getDatabase();
        const artist = db.prepare("SELECT id FROM artists WHERE internal_id = ?").get(artistInternalId);
        if (!artist) return [];

        const rows = db.prepare(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM track_artists ta
            JOIN tracks t ON t.id = ta.track_id
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE ta.artist_id = ? AND ta.role = 'featured'
            ORDER BY t.title ASC
        `).all(artist.id);

        return rows.map((s) => ({
            id: s.id, title: s.title, artist: s.artist || "Unknown",
            artistId: s.artistId || null,
            album: s.album, albumId: s.albumId, duration: s.duration || 0,
            track: s.track || 0, cover: `/api/art/${s.albumId}`,
            url: `/api/stream/${s.id}`, provider: "telegram",
        }));
    }

    createAlbum(name, artistDbId, year = 0, coverUrl = null) {
        const db = getDatabase();
        const internalId = generateId("alb");
        const existing = db.prepare("SELECT id, internal_id FROM albums WHERE name = ? AND artist_id = ?").get(name, artistDbId || null);
        if (existing) return { id: existing.internal_id, dbId: existing.id };
        const result = db.prepare("INSERT INTO albums (internal_id, name, artist_id, year, cover_url) VALUES (?, ?, ?, ?, ?)").run(internalId, name, artistDbId || null, year, coverUrl);
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    createTrack(metadata, albumDbId, artistDbId, albumArtistDbId) {
        const db = getDatabase();
        const internalId = generateId("trk");
        const result = db.prepare(`
            INSERT INTO tracks (internal_id, title, artist_id, album_id, album_artist_id, duration, genre, year, track_number, bitrate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            internalId,
            metadata.title || "Unknown",
            artistDbId || null,
            albumDbId || null,
            albumArtistDbId || artistDbId || null,
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
            WHERE (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) > 0
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
                artistId: s.artistId || null,
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
                artistId: s.artistId || null,
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
            artistId: s.artistId || null,
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
            artistId: s.artistId || null,
            album: s.album, albumId: s.albumId, duration: s.duration || 0,
            track: s.track || 0, cover: `/api/art/${s.albumId}`,
            url: `/api/stream/${s.id}`, provider: "telegram",
        }));
    }

    getArtists() {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT ar.internal_id as id, ar.name,
                   (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount,
                   (SELECT COUNT(DISTINCT t.id) FROM tracks t WHERE t.artist_id = ar.id) as trackCount
            FROM artists ar
            WHERE ar.id IN (
                SELECT DISTINCT artist_id FROM tracks WHERE artist_id IS NOT NULL
                UNION
                SELECT DISTINCT artist_id FROM track_artists WHERE artist_id IS NOT NULL
                UNION
                SELECT DISTINCT artist_id FROM albums WHERE artist_id IS NOT NULL
            )
            ORDER BY ar.name ASC
        `).all();
        return rows.map((a) => ({
            id: a.id, name: a.name, albumCount: a.albumCount,
            trackCount: a.trackCount,
            coverArt: `/api/art/artist/${a.id}`,
            provider: "telegram",
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

        const featuredTracks = db.prepare(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM track_artists ta
            JOIN tracks t ON t.id = ta.track_id
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE ta.artist_id = ? AND ta.role = 'featured'
            ORDER BY t.title ASC
        `).all(artist.id);

        return {
            id: artist.internal_id,
            name: artist.name,
            albumCount: albums.length,
            coverArt: `/api/art/artist/${artist.internal_id}`,
            provider: "telegram",
            album: albums.map((a) => ({
                id: a.id, name: a.name, artist: artist.name,
                artistId: artist.internal_id, year: a.year || 0,
                coverUrl: a.coverUrl || `/api/art/${a.id}`,
                songCount: a.songCount, duration: a.duration,
                provider: "telegram",
            })),
            featuredTracks: featuredTracks.map((s) => ({
                id: s.id, title: s.title, artist: s.artist || "Unknown",
                artistId: s.artistId || null,
                album: s.album, albumId: s.albumId, duration: s.duration || 0,
                track: s.track || 0, cover: `/api/art/${s.albumId}`,
                url: `/api/stream/${s.id}`, provider: "telegram",
            })),
        };
    }

    search(query) {
        const db = getDatabase();
        const q = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

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
            SELECT ar.internal_id as id, ar.name,
                   (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount
            FROM artists ar
            WHERE ar.name LIKE ?
            ORDER BY ar.name ASC
            LIMIT 10
        `).all(q);

        return {
            songs: songs.map((s) => ({
                id: s.id, title: s.title, artist: s.artist || "Unknown",
                artistId: s.artistId || null,
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
                coverArt: `/api/art/artist/${a.id}`, provider: "telegram",
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

    checkFavorites(userId, trackInternalIds) {
        const db = getDatabase();
        const result = {};
        for (const internalId of trackInternalIds) {
            const trackId = this.resolveTrackId(internalId);
            if (!trackId) {
                result[internalId] = false;
                continue;
            }
            const exists = db.prepare("SELECT 1 FROM favorites WHERE user_id = ? AND track_id = ?").get(userId, trackId);
            result[internalId] = !!exists;
        }
        return result;
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

    storeAlbumCover(albumDbId, thumbnail, fullSize, mimeType = "image/jpeg") {
        const db = getDatabase();
        db.prepare(`
            INSERT OR REPLACE INTO album_covers (album_id, thumbnail, full_size, mime_type)
            VALUES (?, ?, ?, ?)
        `).run(albumDbId, thumbnail, fullSize, mimeType);
    }

    storeArtistCover(artistDbId, thumbnail, fullSize, mimeType = "image/jpeg") {
        const db = getDatabase();
        db.prepare(`
            INSERT OR REPLACE INTO artist_covers (artist_id, thumbnail, full_size, mime_type)
            VALUES (?, ?, ?, ?)
        `).run(artistDbId, thumbnail, fullSize, mimeType);
    }

    getAlbumCover(albumInternalId, size = "full") {
        const db = getDatabase();
        const album = db.prepare("SELECT id FROM albums WHERE internal_id = ?").get(albumInternalId);
        if (!album) return null;
        const col = size === "thumb" ? "thumbnail" : "full_size";
        const row = db.prepare(`SELECT ${col} as image, mime_type FROM album_covers WHERE album_id = ?`).get(album.id);
        return row && row.image ? { image: row.image, mimeType: row.mime_type } : null;
    }

    getArtistCover(artistInternalId, size = "full") {
        const db = getDatabase();
        const artist = db.prepare("SELECT id FROM artists WHERE internal_id = ?").get(artistInternalId);
        if (!artist) return null;
        const col = size === "thumb" ? "thumbnail" : "full_size";
        const row = db.prepare(`SELECT ${col} as image, mime_type FROM artist_covers WHERE artist_id = ?`).get(artist.id);
        return row && row.image ? { image: row.image, mimeType: row.mime_type } : null;
    }

    searchTracks(query) {
        const db = getDatabase();
        const q = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
        return db.prepare(`
            SELECT t.internal_id as id, t.title,
                   ar.name as artist, a.name as album
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE t.title LIKE ? OR ar.name LIKE ? OR a.name LIKE ?
            ORDER BY t.title ASC
            LIMIT 10
        `).all(q, q, q);
    }

    deleteTrack(trackInternalId) {
        const db = getDatabase();
        const track = db.prepare("SELECT id, title, album_id, artist_id FROM tracks WHERE internal_id = ?").get(trackInternalId);
        if (!track) return null;

        const mappings = this.findMappingByTrackId(trackInternalId);
        const albumId = track.album_id;
        const artistId = track.artist_id;

        db.prepare("DELETE FROM favorites WHERE track_id = ?").run(track.id);
        db.prepare("DELETE FROM playlist_tracks WHERE track_id = ?").run(track.id);
        db.prepare("DELETE FROM track_artists WHERE track_id = ?").run(track.id);
        db.prepare("DELETE FROM lyrics_cache WHERE track_id = ?").run(track.id);
        db.prepare("DELETE FROM tracks WHERE id = ?").run(track.id);

        if (albumId) {
            const remaining = db.prepare("SELECT COUNT(*) as c FROM tracks WHERE album_id = ?").get(albumId).c;
            if (remaining === 0) {
                db.prepare("DELETE FROM album_covers WHERE album_id = ?").run(albumId);
                db.prepare("DELETE FROM albums WHERE id = ?").run(albumId);
            }
        }
        if (artistId) {
            const remaining = db.prepare("SELECT COUNT(*) as c FROM albums WHERE artist_id = ?").get(artistId).c;
            if (remaining === 0) {
                db.prepare("DELETE FROM artist_covers WHERE artist_id = ?").run(artistId);
                db.prepare("DELETE FROM artists WHERE id = ?").run(artistId);
            }
        }

        return { title: track.title, mappings };
    }

    // ─── Playlists ────────────────────────────────────────

    createPlaylist(userId, name) {
        const db = getDatabase();
        const { generateId } = require("../db/ids");
        const internalId = generateId("pl");
        db.prepare("INSERT INTO playlists (internal_id, user_id, name) VALUES (?, ?, ?)").run(internalId, userId, name || "New Playlist");
        return { id: internalId, name: name || "New Playlist", trackCount: 0, duration: 0 };
    }

    getUserPlaylists(userId) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT p.*,
                   (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) as trackCount,
                   (SELECT COALESCE(SUM(t.duration), 0) FROM playlist_tracks pt JOIN tracks t ON t.id = pt.track_id WHERE pt.playlist_id = p.id) as duration
            FROM playlists p
            WHERE p.user_id = ?
            ORDER BY p.updated_at DESC
        `).all(userId);
        return rows.map((r) => ({
            id: r.internal_id,
            name: r.name,
            trackCount: r.trackCount,
            duration: r.duration,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        }));
    }

    getPlaylist(playlistInternalId, userId) {
        const db = getDatabase();
        const playlist = db.prepare("SELECT * FROM playlists WHERE internal_id = ? AND user_id = ?").get(playlistInternalId, userId);
        if (!playlist) return null;

        const tracks = db.prepare(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM playlist_tracks pt
            JOIN tracks t ON t.id = pt.track_id
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE pt.playlist_id = ?
            ORDER BY pt.position ASC
        `).all(playlist.id);

        return {
            id: playlist.internal_id,
            name: playlist.name,
            trackCount: tracks.length,
            duration: tracks.reduce((sum, s) => sum + (s.duration || 0), 0),
            tracks: tracks.map((s) => ({
                id: s.id, title: s.title, artist: s.artist || "Unknown",
                artistId: s.artistId || null,
                album: s.album, albumId: s.albumId, duration: s.duration || 0,
                track: s.track || 0, cover: `/api/art/${s.albumId}`,
                url: `/api/stream/${s.id}`, provider: "telegram",
            })),
        };
    }

    renamePlaylist(playlistInternalId, userId, name) {
        const db = getDatabase();
        db.prepare("UPDATE playlists SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE internal_id = ? AND user_id = ?").run(name, playlistInternalId, userId);
    }

    deletePlaylist(playlistInternalId, userId) {
        const db = getDatabase();
        const playlist = db.prepare("SELECT id FROM playlists WHERE internal_id = ? AND user_id = ?").get(playlistInternalId, userId);
        if (!playlist) return false;
        db.prepare("DELETE FROM playlists WHERE id = ?").run(playlist.id);
        return true;
    }

    addTrackToPlaylist(playlistInternalId, userId, trackInternalId, position) {
        const db = getDatabase();
        const playlist = db.prepare("SELECT id FROM playlists WHERE internal_id = ? AND user_id = ?").get(playlistInternalId, userId);
        if (!playlist) return false;
        const track = db.prepare("SELECT id FROM tracks WHERE internal_id = ?").get(trackInternalId);
        if (!track) return false;

        if (position !== undefined && position !== null) {
            db.prepare("UPDATE playlist_tracks SET position = position + 1 WHERE playlist_id = ? AND position >= ?").run(playlist.id, position);
            db.prepare("INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)").run(playlist.id, track.id, position);
        } else {
            const maxPos = db.prepare("SELECT COALESCE(MAX(position), -1) as pos FROM playlist_tracks WHERE playlist_id = ?").get(playlist.id).pos;
            db.prepare("INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)").run(playlist.id, track.id, maxPos + 1);
        }
        db.prepare("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(playlist.id);
        return true;
    }

    removeTrackFromPlaylist(playlistInternalId, userId, trackInternalId) {
        const db = getDatabase();
        const playlist = db.prepare("SELECT id FROM playlists WHERE internal_id = ? AND user_id = ?").get(playlistInternalId, userId);
        if (!playlist) return false;
        const track = db.prepare("SELECT id FROM tracks WHERE internal_id = ?").get(trackInternalId);
        if (!track) return false;
        db.prepare("DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?").run(playlist.id, track.id);
        db.prepare("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(playlist.id);
        return true;
    }

    reorderPlaylist(playlistInternalId, userId, trackInternalIds) {
        const db = getDatabase();
        const playlist = db.prepare("SELECT id FROM playlists WHERE internal_id = ? AND user_id = ?").get(playlistInternalId, userId);
        if (!playlist) return false;

        const updatePos = db.prepare("UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?");
        const getTrackId = db.prepare("SELECT id FROM tracks WHERE internal_id = ?");
        const reorder = db.transaction(() => {
            for (let i = 0; i < trackInternalIds.length; i++) {
                const track = getTrackId.get(trackInternalIds[i]);
                if (track) {
                    updatePos.run(i, playlist.id, track.id);
                }
            }
        });
        reorder();
        db.prepare("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(playlist.id);
        return true;
    }

    // ─── Favourite Artists ────────────────────────────────

    toggleFavoriteArtist(userId, artistInternalId) {
        const db = getDatabase();
        const artist = db.prepare("SELECT id FROM artists WHERE internal_id = ?").get(artistInternalId);
        if (!artist) return false;
        const existing = db.prepare("SELECT 1 FROM favourite_artists WHERE user_id = ? AND artist_id = ?").get(userId, artist.id);
        if (existing) {
            db.prepare("DELETE FROM favourite_artists WHERE user_id = ? AND artist_id = ?").run(userId, artist.id);
            return false;
        } else {
            db.prepare("INSERT INTO favourite_artists (user_id, artist_id) VALUES (?, ?)").run(userId, artist.id);
            return true;
        }
    }

    checkFavoriteArtists(userId, artistInternalIds) {
        const db = getDatabase();
        const result = {};
        for (const internalId of artistInternalIds) {
            const artist = db.prepare("SELECT id FROM artists WHERE internal_id = ?").get(internalId);
            if (!artist) { result[internalId] = false; continue; }
            const exists = db.prepare("SELECT 1 FROM favourite_artists WHERE user_id = ? AND artist_id = ?").get(userId, artist.id);
            result[internalId] = !!exists;
        }
        return result;
    }

    getFavouriteArtists(userId) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT ar.internal_id as id, ar.name,
                   (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount,
                   (SELECT COUNT(DISTINCT t.id) FROM tracks t WHERE t.artist_id = ar.id) as trackCount
            FROM favourite_artists fa
            JOIN artists ar ON ar.id = fa.artist_id
            WHERE fa.user_id = ?
            ORDER BY ar.name ASC
        `).all(userId);
        return rows.map((a) => ({
            id: a.id, name: a.name, albumCount: a.albumCount,
            trackCount: a.trackCount, coverArt: `/api/art/artist/${a.id}`,
            provider: "telegram",
        }));
    }

    // ─── Favourite Albums ─────────────────────────────────

    toggleFavoriteAlbum(userId, albumInternalId) {
        const db = getDatabase();
        const album = db.prepare("SELECT id FROM albums WHERE internal_id = ?").get(albumInternalId);
        if (!album) return false;
        const existing = db.prepare("SELECT 1 FROM favourite_albums WHERE user_id = ? AND album_id = ?").get(userId, album.id);
        if (existing) {
            db.prepare("DELETE FROM favourite_albums WHERE user_id = ? AND album_id = ?").run(userId, album.id);
            return false;
        } else {
            db.prepare("INSERT INTO favourite_albums (user_id, album_id) VALUES (?, ?)").run(userId, album.id);
            return true;
        }
    }

    checkFavoriteAlbums(userId, albumInternalIds) {
        const db = getDatabase();
        const result = {};
        for (const internalId of albumInternalIds) {
            const album = db.prepare("SELECT id FROM albums WHERE internal_id = ?").get(internalId);
            if (!album) { result[internalId] = false; continue; }
            const exists = db.prepare("SELECT 1 FROM favourite_albums WHERE user_id = ? AND album_id = ?").get(userId, album.id);
            result[internalId] = !!exists;
        }
        return result;
    }

    getFavouriteAlbums(userId) {
        const db = getDatabase();
        const rows = db.prepare(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId,
                   (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as songCount,
                   (SELECT COALESCE(SUM(duration), 0) FROM tracks WHERE album_id = a.id) as duration
            FROM favourite_albums fa
            JOIN albums a ON a.id = fa.album_id
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE fa.user_id = ?
            ORDER BY a.name ASC
        `).all(userId);
        return rows.map((r) => ({
            id: r.id, name: r.name, artist: r.artist || "Unknown", artistId: r.artistId,
            year: r.year || 0, coverUrl: r.coverUrl || `/api/art/${r.id}`,
            songCount: r.songCount, duration: r.duration, provider: "telegram",
        }));
    }

    // ─── Smart Playlists ──────────────────────────────────

    createSmartPlaylist(userId, name, ruleType, ruleLimit = 50) {
        const db = getDatabase();
        const { generateId } = require("../db/ids");
        const internalId = generateId("spl");
        db.prepare("INSERT INTO smart_playlists (internal_id, user_id, name, rule_type, rule_limit) VALUES (?, ?, ?, ?, ?)").run(internalId, userId, name, ruleType, ruleLimit);
        return { id: internalId, name, ruleType, ruleLimit };
    }

    getUserSmartPlaylists(userId) {
        const db = getDatabase();
        return db.prepare("SELECT * FROM smart_playlists WHERE user_id = ? ORDER BY created_at DESC").all(userId).map((r) => ({
            id: r.internal_id, name: r.name, ruleType: r.rule_type, ruleLimit: r.rule_limit,
        }));
    }

    deleteSmartPlaylist(internalId, userId) {
        const db = getDatabase();
        const result = db.prepare("DELETE FROM smart_playlists WHERE internal_id = ? AND user_id = ?").run(internalId, userId);
        return result.changes > 0;
    }

    evaluateSmartPlaylist(internalId, userId) {
        const db = getDatabase();
        const sp = db.prepare("SELECT * FROM smart_playlists WHERE internal_id = ? AND user_id = ?").get(internalId, userId);
        if (!sp) return null;

        let query;
        switch (sp.rule_type) {
            case "most_played":
                query = `
                    SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                           ar.name as artist, ar.internal_id as artistId,
                           a.name as album, a.internal_id as albumId,
                           COUNT(ph.id) as play_count
                    FROM tracks t
                    LEFT JOIN artists ar ON ar.id = t.artist_id
                    LEFT JOIN albums a ON a.id = t.album_id
                    LEFT JOIN play_history ph ON ph.track_id = t.id
                    GROUP BY t.id
                    ORDER BY play_count DESC, t.title ASC
                    LIMIT ?
                `;
                break;
            case "recently_added":
                query = `
                    SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                           ar.name as artist, ar.internal_id as artistId,
                           a.name as album, a.internal_id as albumId
                    FROM tracks t
                    LEFT JOIN artists ar ON ar.id = t.artist_id
                    LEFT JOIN albums a ON a.id = t.album_id
                    ORDER BY t.created_at DESC
                    LIMIT ?
                `;
                break;
            case "frequently_played":
                query = `
                    SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                           ar.name as artist, ar.internal_id as artistId,
                           a.name as album, a.internal_id as albumId,
                           COUNT(ph.id) as play_count
                    FROM tracks t
                    LEFT JOIN artists ar ON ar.id = t.artist_id
                    LEFT JOIN albums a ON a.id = t.album_id
                    LEFT JOIN play_history ph ON ph.track_id = t.id AND ph.played_at >= datetime('now', '-30 days')
                    GROUP BY t.id
                    HAVING play_count > 0
                    ORDER BY play_count DESC, t.title ASC
                    LIMIT ?
                `;
                break;
            case "forgotten_gems":
                query = `
                    SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                           ar.name as artist, ar.internal_id as artistId,
                           a.name as album, a.internal_id as albumId
                    FROM tracks t
                    LEFT JOIN artists ar ON ar.id = t.artist_id
                    LEFT JOIN albums a ON a.id = t.album_id
                    JOIN favorites f ON f.track_id = t.id AND f.user_id = ?
                    WHERE t.id NOT IN (
                        SELECT ph.track_id FROM play_history ph
                        WHERE ph.user_id = ? AND ph.played_at >= datetime('now', '-30 days')
                    )
                    ORDER BY t.title ASC
                    LIMIT ?
                `;
                break;
            case "random":
                query = `
                    SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                           ar.name as artist, ar.internal_id as artistId,
                           a.name as album, a.internal_id as albumId
                    FROM tracks t
                    LEFT JOIN artists ar ON ar.id = t.artist_id
                    LEFT JOIN albums a ON a.id = t.album_id
                    ORDER BY RANDOM()
                    LIMIT ?
                `;
                break;
            default:
                return { id: sp.internal_id, name: sp.name, ruleType: sp.rule_type, tracks: [] };
        }

        let rows;
        if (sp.rule_type === "forgotten_gems") {
            rows = db.prepare(query).all(userId, userId, sp.rule_limit);
        } else {
            rows = db.prepare(query).all(sp.rule_limit);
        }

        return {
            id: sp.internal_id,
            name: sp.name,
            ruleType: sp.rule_type,
            ruleLimit: sp.rule_limit,
            tracks: rows.map((s) => ({
                id: s.id, title: s.title, artist: s.artist || "Unknown",
                artistId: s.artistId || null,
                album: s.album, albumId: s.albumId, duration: s.duration || 0,
                track: s.track || 0, cover: `/api/art/${s.albumId}`,
                url: `/api/stream/${s.id}`, provider: "telegram",
            })),
        };
    }

    // ─── FTS5 Search ──────────────────────────────────────

    searchFTS5(query) {
        const db = getDatabase();
        const q = query.trim();
        if (!q) return { songs: [], albums: [], artists: [] };

        try {
            const ftsQuery = q.split(/\s+/).map((w) => `"${w.replace(/"/g, '""')}"`).join(" OR ");

            const songs = db.prepare(`
                SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                       ar.name as artist, ar.internal_id as artistId,
                       a.name as album, a.internal_id as albumId,
                       rank
                FROM tracks_fts
                JOIN tracks t ON t.id = tracks_fts.rowid
                LEFT JOIN artists ar ON ar.id = t.artist_id
                LEFT JOIN albums a ON a.id = t.album_id
                WHERE tracks_fts MATCH ?
                ORDER BY rank
                LIMIT 20
            `).all(ftsQuery);

            const albums = db.prepare(`
                SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                       ar.name as artist, ar.internal_id as artistId,
                       rank
                FROM albums_fts
                JOIN albums a ON a.id = albums_fts.rowid
                LEFT JOIN artists ar ON ar.id = a.artist_id
                WHERE albums_fts MATCH ?
                ORDER BY rank
                LIMIT 10
            `).all(ftsQuery);

            const artists = db.prepare(`
                SELECT ar.internal_id as id, ar.name,
                       (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount,
                       rank
                FROM artists_fts
                JOIN artists ar ON ar.id = artists_fts.rowid
                WHERE artists_fts MATCH ?
                ORDER BY rank
                LIMIT 10
            `).all(ftsQuery);

            return {
                songs: songs.map((s) => ({
                    id: s.id, title: s.title, artist: s.artist || "Unknown",
                    artistId: s.artistId || null,
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
                    coverArt: `/api/art/artist/${a.id}`, provider: "telegram",
                })),
            };
        } catch (err) {
            console.warn("[Search] FTS5 failed, falling back to LIKE:", err.message);
            return this.search(q);
        }
    }
}

module.exports = new MetadataService();
