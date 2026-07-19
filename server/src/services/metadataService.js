const { dbGet, dbAll, dbRun, dbExec, dbTransaction } = require("../db/dbHelpers");
const { generateId } = require("../db/ids");
const { normalizeArtistName } = require("../utils/artistParser");

class MetadataService {
    async createArtist(name, coverUrl = null) {
        const internalId = generateId("art");
        const existing = await dbGet("SELECT id, internal_id FROM artists WHERE name = ?", name);
        if (existing) return { id: existing.internal_id, dbId: existing.id };
        const result = await dbRun("INSERT INTO artists (internal_id, name, cover_url) VALUES (?, ?, ?)", internalId, name, coverUrl);
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    async findOrCreateArtist(name, coverUrl = null) {
        if (!name || typeof name !== "string") return null;
        const trimmed = name.trim();
        if (!trimmed) return null;

        const norm = normalizeArtistName(trimmed);

        const existing = await dbGet(`
            SELECT id, internal_id FROM artists
            WHERE LOWER(REPLACE(name, ' ', ' ')) = ?
        `, norm);

        if (existing) return { id: existing.internal_id, dbId: existing.id };

        const internalId = generateId("art");
        const result = await dbRun("INSERT INTO artists (internal_id, name, cover_url) VALUES (?, ?, ?)", internalId, trimmed, coverUrl);
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    async linkTrackArtist(trackDbId, artistDbId, role = "primary") {
        await dbRun("INSERT OR IGNORE INTO track_artists (track_id, artist_id, role) VALUES (?, ?, ?)", trackDbId, artistDbId, role);
    }

    async getFeaturedTracks(artistInternalId) {
        const artist = await dbGet("SELECT id FROM artists WHERE internal_id = ?", artistInternalId);
        if (!artist) return [];

        const rows = await dbAll(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM track_artists ta
            JOIN tracks t ON t.id = ta.track_id
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE ta.artist_id = ? AND ta.role = 'featured'
            ORDER BY t.title ASC
        `, artist.id);

        return rows.map((s) => ({
            id: s.id, title: s.title, artist: s.artist || "Unknown",
            artistId: s.artistId || null,
            album: s.album, albumId: s.albumId, duration: s.duration || 0,
            track: s.track || 0, cover: `/api/art/${s.albumId}`,
            url: `/api/stream/${s.id}`, provider: "telegram",
        }));
    }

    async createAlbum(name, artistDbId, year = 0, coverUrl = null) {
        const internalId = generateId("alb");
        const existing = await dbGet("SELECT id, internal_id FROM albums WHERE name = ? AND artist_id = ?", name, artistDbId || null);
        if (existing) return { id: existing.internal_id, dbId: existing.id };
        const result = await dbRun("INSERT INTO albums (internal_id, name, artist_id, year, cover_url) VALUES (?, ?, ?, ?, ?)", internalId, name, artistDbId || null, year, coverUrl);
        return { id: internalId, dbId: result.lastInsertRowid };
    }

    async createTrack(metadata, albumDbId, artistDbId, albumArtistDbId) {
        const internalId = generateId("trk");
        const result = await dbRun(`
            INSERT INTO tracks (internal_id, title, artist_id, album_id, album_artist_id, duration, genre, year, track_number, bitrate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
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

    async createProviderMapping(trackDbId, provider, fileData) {
        const result = await dbRun(`
            INSERT INTO provider_mappings (track_id, provider, provider_track_id, telegram_channel_id, telegram_message_id, telegram_file_id, telegram_file_unique_id, file_name, file_size, mime_type, checksum, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
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

    async findTrackByChecksum(checksum) {
        const row = await dbGet(`
            SELECT t.internal_id, t.title, pm.provider
            FROM provider_mappings pm
            JOIN tracks t ON t.id = pm.track_id
            WHERE pm.checksum = ?
            LIMIT 1
        `, checksum);
        return row || null;
    }

    async findMappingByTrackId(trackInternalId) {
        return await dbAll(`
            SELECT pm.*, t.internal_id as track_internal_id
            FROM provider_mappings pm
            JOIN tracks t ON t.id = pm.track_id
            WHERE t.internal_id = ?
        `, trackInternalId);
    }

    async resolveTrackId(internalId) {
        const track = await dbGet("SELECT id FROM tracks WHERE internal_id = ?", internalId);
        return track ? track.id : null;
    }

    async getAlbums(offset = 0, limit = 50) {
        const rows = await dbAll(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId,
                   (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as songCount,
                   (SELECT COALESCE(SUM(duration), 0) FROM tracks WHERE album_id = a.id) as duration
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) > 0
            ORDER BY a.name ASC
            LIMIT ? OFFSET ?
        `, limit, offset);
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

    async getAlbumTracks(albumInternalId) {
        const album = await dbGet(`
            SELECT a.*, ar.name as artist_name, ar.internal_id as artist_internal_id
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE a.internal_id = ?
        `, albumInternalId);
        if (!album) return null;

        const songs = await dbAll(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album_name, a.internal_id as albumId
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE t.album_id = ?
            ORDER BY t.track_number ASC, t.title ASC
        `, album.id);

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

    async getRecentAlbums(userId, size = 12) {
        const rows = await dbAll(`
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
        `, userId, size);
        return rows.map((r) => ({
            id: r.id, name: r.name, artist: r.artist || "Unknown", artistId: r.artistId,
            year: r.year || 0, coverUrl: r.coverUrl || `/api/art/${r.id}`,
            provider: "telegram",
        }));
    }

    async getNewestAlbums(size = 12) {
        const rows = await dbAll(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
            ORDER BY a.created_at DESC
            LIMIT ?
        `, size);
        return rows.map((r) => ({
            id: r.id, name: r.name, artist: r.artist || "Unknown", artistId: r.artistId,
            year: r.year || 0, coverUrl: r.coverUrl || `/api/art/${r.id}`,
            provider: "telegram",
        }));
    }

    async getFrequentAlbums(userId, size = 12) {
        const rows = await dbAll(`
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
        `, userId, size);
        return rows.map((r) => ({
            id: r.id, name: r.name, artist: r.artist || "Unknown", artistId: r.artistId,
            year: r.year || 0, coverUrl: r.coverUrl || `/api/art/${r.id}`,
            provider: "telegram",
        }));
    }

    async getStarredItems(userId) {
        const songs = await dbAll(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM favorites f
            JOIN tracks t ON t.id = f.track_id
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE f.user_id = ?
            ORDER BY t.title ASC
        `, userId);

        const albumIds = [...new Set(songs.map((s) => s.albumId).filter(Boolean))];
        const albums = albumIds.length > 0
            ? await dbAll(`
                SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                       ar.name as artist, ar.internal_id as artistId
                FROM albums a
                LEFT JOIN artists ar ON ar.id = a.artist_id
                WHERE a.id IN (${albumIds.map(() => "?").join(",")})
            `, ...albumIds)
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

    async getSongs(offset = 0, limit = 50) {
        const rows = await dbAll(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            ORDER BY t.title ASC
            LIMIT ? OFFSET ?
        `, limit, offset);
        return rows.map((s) => ({
            id: s.id, title: s.title, artist: s.artist || "Unknown",
            artistId: s.artistId || null,
            album: s.album, albumId: s.albumId, duration: s.duration || 0,
            track: s.track || 0, cover: `/api/art/${s.albumId}`,
            url: `/api/stream/${s.id}`, provider: "telegram",
        }));
    }

    async getRandomSongs(size = 20) {
        const rows = await dbAll(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            ORDER BY RANDOM()
            LIMIT ?
        `, size);
        return rows.map((s) => ({
            id: s.id, title: s.title, artist: s.artist || "Unknown",
            artistId: s.artistId || null,
            album: s.album, albumId: s.albumId, duration: s.duration || 0,
            track: s.track || 0, cover: `/api/art/${s.albumId}`,
            url: `/api/stream/${s.id}`, provider: "telegram",
        }));
    }

    async getArtists() {
        const rows = await dbAll(`
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
        `);
        return rows.map((a) => ({
            id: a.id, name: a.name, albumCount: a.albumCount,
            trackCount: a.trackCount,
            coverArt: `/api/art/artist/${a.id}`,
            provider: "telegram",
        }));
    }

    async getArtist(artistInternalId) {
        const artist = await dbGet("SELECT * FROM artists WHERE internal_id = ?", artistInternalId);
        if (!artist) return null;

        const albums = await dbAll(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as songCount,
                   (SELECT COALESCE(SUM(duration), 0) FROM tracks WHERE album_id = a.id) as duration
            FROM albums a
            WHERE a.artist_id = ?
            ORDER BY a.year ASC, a.name ASC
        `, artist.id);

        const featuredTracks = await dbAll(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM track_artists ta
            JOIN tracks t ON t.id = ta.track_id
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE ta.artist_id = ? AND ta.role = 'featured'
            ORDER BY t.title ASC
        `, artist.id);

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

    async search(query) {
        const q = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

        const songs = await dbAll(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE t.title LIKE ? OR ar.name LIKE ? OR a.name LIKE ?
            ORDER BY t.title ASC
            LIMIT 20
        `, q, q, q);

        const albums = await dbAll(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId
            FROM albums a
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE a.name LIKE ? OR ar.name LIKE ?
            ORDER BY a.name ASC
            LIMIT 10
        `, q, q);

        const artists = await dbAll(`
            SELECT ar.internal_id as id, ar.name,
                   (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount
            FROM artists ar
            WHERE ar.name LIKE ?
            ORDER BY ar.name ASC
            LIMIT 10
        `, q);

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

    async recordPlay(userId, trackInternalId) {
        const trackId = await this.resolveTrackId(trackInternalId);
        if (!trackId) return;
        await dbRun("INSERT INTO play_history (user_id, track_id) VALUES (?, ?)", userId, trackId);
    }

    async toggleFavorite(userId, trackInternalId) {
        const trackId = await this.resolveTrackId(trackInternalId);
        if (!trackId) return false;
        const existing = await dbGet("SELECT 1 FROM favorites WHERE user_id = ? AND track_id = ?", userId, trackId);
        if (existing) {
            await dbRun("DELETE FROM favorites WHERE user_id = ? AND track_id = ?", userId, trackId);
            return false;
        } else {
            await dbRun("INSERT INTO favorites (user_id, track_id) VALUES (?, ?)", userId, trackId);
            return true;
        }
    }

    async checkFavorites(userId, trackInternalIds) {
        const result = {};
        for (const internalId of trackInternalIds) {
            const trackId = await this.resolveTrackId(internalId);
            if (!trackId) {
                result[internalId] = false;
                continue;
            }
            const exists = await dbGet("SELECT 1 FROM favorites WHERE user_id = ? AND track_id = ?", userId, trackId);
            result[internalId] = !!exists;
        }
        return result;
    }

    async getTrackCount() {
        const row = await dbGet("SELECT COUNT(*) as count FROM tracks");
        return row.count;
    }

    async getArtistCount() {
        const row = await dbGet("SELECT COUNT(*) as count FROM artists");
        return row.count;
    }

    async getAlbumCount() {
        const row = await dbGet("SELECT COUNT(*) as count FROM albums");
        return row.count;
    }

    async storeAlbumCover(albumDbId, thumbnail, fullSize, mimeType = "image/jpeg") {
        await dbRun(`
            INSERT OR REPLACE INTO album_covers (album_id, thumbnail, full_size, mime_type)
            VALUES (?, ?, ?, ?)
        `, albumDbId, thumbnail, fullSize, mimeType);
    }

    async storeArtistCover(artistDbId, thumbnail, fullSize, mimeType = "image/jpeg") {
        await dbRun(`
            INSERT OR REPLACE INTO artist_covers (artist_id, thumbnail, full_size, mime_type)
            VALUES (?, ?, ?, ?)
        `, artistDbId, thumbnail, fullSize, mimeType);
    }

    async getAlbumCover(albumInternalId, size = "full") {
        const album = await dbGet("SELECT id FROM albums WHERE internal_id = ?", albumInternalId);
        if (!album) return null;
        const col = size === "thumb" ? "thumbnail" : "full_size";
        const row = await dbGet(`SELECT ${col} as image, mime_type FROM album_covers WHERE album_id = ?`, album.id);
        if (!row || !row.image) return null;
        const image = Buffer.isBuffer(row.image) ? row.image : Buffer.from(row.image);
        if (image.length < 100) return null;
        return { image, mimeType: row.mime_type };
    }

    async getArtistCover(artistInternalId, size = "full") {
        const artist = await dbGet("SELECT id FROM artists WHERE internal_id = ?", artistInternalId);
        if (!artist) return null;
        const col = size === "thumb" ? "thumbnail" : "full_size";
        const row = await dbGet(`SELECT ${col} as image, mime_type FROM artist_covers WHERE artist_id = ?`, artist.id);
        if (!row || !row.image) return null;
        const image = Buffer.isBuffer(row.image) ? row.image : Buffer.from(row.image);
        if (image.length < 100) return null;
        return { image, mimeType: row.mime_type };
    }

    async searchTracks(query) {
        const q = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
        return await dbAll(`
            SELECT t.internal_id as id, t.title,
                   ar.name as artist, a.name as album
            FROM tracks t
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE t.title LIKE ? OR ar.name LIKE ? OR a.name LIKE ?
            ORDER BY t.title ASC
            LIMIT 10
        `, q, q, q);
    }

    async deleteTrack(trackInternalId) {
        const track = await dbGet("SELECT id, title, album_id, artist_id FROM tracks WHERE internal_id = ?", trackInternalId);
        if (!track) return null;

        const mappings = await this.findMappingByTrackId(trackInternalId);
        const albumId = track.album_id;
        const artistId = track.artist_id;

        await dbRun("DELETE FROM favorites WHERE track_id = ?", track.id);
        await dbRun("DELETE FROM playlist_tracks WHERE track_id = ?", track.id);
        await dbRun("DELETE FROM track_artists WHERE track_id = ?", track.id);
        await dbRun("DELETE FROM lyrics_cache WHERE track_id = ?", track.id);
        await dbRun("DELETE FROM tracks WHERE id = ?", track.id);

        if (albumId) {
            const remaining = await dbGet("SELECT COUNT(*) as c FROM tracks WHERE album_id = ?", albumId);
            if (remaining.c === 0) {
                await dbRun("DELETE FROM album_covers WHERE album_id = ?", albumId);
                await dbRun("DELETE FROM albums WHERE id = ?", albumId);
            }
        }
        if (artistId) {
            const remaining = await dbGet("SELECT COUNT(*) as c FROM albums WHERE artist_id = ?", artistId);
            if (remaining.c === 0) {
                await dbRun("DELETE FROM artist_covers WHERE artist_id = ?", artistId);
                await dbRun("DELETE FROM artists WHERE id = ?", artistId);
            }
        }

        return { title: track.title, mappings };
    }

    // ─── Playlists ────────────────────────────────────────

    async createPlaylist(userId, name) {
        const { generateId } = require("../db/ids");
        const internalId = generateId("pl");
        await dbRun("INSERT INTO playlists (internal_id, user_id, name) VALUES (?, ?, ?)", internalId, userId, name || "New Playlist");
        return { id: internalId, name: name || "New Playlist", trackCount: 0, duration: 0 };
    }

    async getUserPlaylists(userId) {
        const rows = await dbAll(`
            SELECT p.*,
                   (SELECT COUNT(*) FROM playlist_tracks pt WHERE pt.playlist_id = p.id) as trackCount,
                   (SELECT COALESCE(SUM(t.duration), 0) FROM playlist_tracks pt JOIN tracks t ON t.id = pt.track_id WHERE pt.playlist_id = p.id) as duration
            FROM playlists p
            WHERE p.user_id = ?
            ORDER BY p.updated_at DESC
        `, userId);
        return rows.map((r) => ({
            id: r.internal_id,
            name: r.name,
            trackCount: r.trackCount,
            duration: r.duration,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        }));
    }

    async getPlaylist(playlistInternalId, userId) {
        const playlist = await dbGet("SELECT * FROM playlists WHERE internal_id = ? AND user_id = ?", playlistInternalId, userId);
        if (!playlist) return null;

        const tracks = await dbAll(`
            SELECT t.internal_id as id, t.title, t.duration, t.track_number as track, t.genre, t.year,
                   ar.name as artist, ar.internal_id as artistId,
                   a.name as album, a.internal_id as albumId
            FROM playlist_tracks pt
            JOIN tracks t ON t.id = pt.track_id
            LEFT JOIN artists ar ON ar.id = t.artist_id
            LEFT JOIN albums a ON a.id = t.album_id
            WHERE pt.playlist_id = ?
            ORDER BY pt.position ASC
        `, playlist.id);

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

    async renamePlaylist(playlistInternalId, userId, name) {
        await dbRun("UPDATE playlists SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE internal_id = ? AND user_id = ?", name, playlistInternalId, userId);
    }

    async deletePlaylist(playlistInternalId, userId) {
        const playlist = await dbGet("SELECT id FROM playlists WHERE internal_id = ? AND user_id = ?", playlistInternalId, userId);
        if (!playlist) return false;
        await dbRun("DELETE FROM playlists WHERE id = ?", playlist.id);
        return true;
    }

    async addTrackToPlaylist(playlistInternalId, userId, trackInternalId, position) {
        const playlist = await dbGet("SELECT id FROM playlists WHERE internal_id = ? AND user_id = ?", playlistInternalId, userId);
        if (!playlist) return false;
        const track = await dbGet("SELECT id FROM tracks WHERE internal_id = ?", trackInternalId);
        if (!track) return false;

        if (position !== undefined && position !== null) {
            await dbRun("UPDATE playlist_tracks SET position = position + 1 WHERE playlist_id = ? AND position >= ?", playlist.id, position);
            await dbRun("INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)", playlist.id, track.id, position);
        } else {
            const maxPos = await dbGet("SELECT COALESCE(MAX(position), -1) as pos FROM playlist_tracks WHERE playlist_id = ?", playlist.id);
            await dbRun("INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)", playlist.id, track.id, maxPos.pos + 1);
        }
        await dbRun("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", playlist.id);
        return true;
    }

    async removeTrackFromPlaylist(playlistInternalId, userId, trackInternalId) {
        const playlist = await dbGet("SELECT id FROM playlists WHERE internal_id = ? AND user_id = ?", playlistInternalId, userId);
        if (!playlist) return false;
        const track = await dbGet("SELECT id FROM tracks WHERE internal_id = ?", trackInternalId);
        if (!track) return false;
        await dbRun("DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?", playlist.id, track.id);
        await dbRun("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", playlist.id);
        return true;
    }

    async reorderPlaylist(playlistInternalId, userId, trackInternalIds) {
        const playlist = await dbGet("SELECT id FROM playlists WHERE internal_id = ? AND user_id = ?", playlistInternalId, userId);
        if (!playlist) return false;

        const reorder = async () => {
            for (let i = 0; i < trackInternalIds.length; i++) {
                const track = await dbGet("SELECT id FROM tracks WHERE internal_id = ?", trackInternalIds[i]);
                if (track) {
                    await dbRun("UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?", i, playlist.id, track.id);
                }
            }
        };
        await dbTransaction(reorder);
        await dbRun("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", playlist.id);
        return true;
    }

    // ─── Favourite Artists ────────────────────────────────

    async toggleFavoriteArtist(userId, artistInternalId) {
        const artist = await dbGet("SELECT id FROM artists WHERE internal_id = ?", artistInternalId);
        if (!artist) return false;
        const existing = await dbGet("SELECT 1 FROM favourite_artists WHERE user_id = ? AND artist_id = ?", userId, artist.id);
        if (existing) {
            await dbRun("DELETE FROM favourite_artists WHERE user_id = ? AND artist_id = ?", userId, artist.id);
            return false;
        } else {
            await dbRun("INSERT INTO favourite_artists (user_id, artist_id) VALUES (?, ?)", userId, artist.id);
            return true;
        }
    }

    async checkFavoriteArtists(userId, artistInternalIds) {
        const result = {};
        for (const internalId of artistInternalIds) {
            const artist = await dbGet("SELECT id FROM artists WHERE internal_id = ?", internalId);
            if (!artist) { result[internalId] = false; continue; }
            const exists = await dbGet("SELECT 1 FROM favourite_artists WHERE user_id = ? AND artist_id = ?", userId, artist.id);
            result[internalId] = !!exists;
        }
        return result;
    }

    async getFavouriteArtists(userId) {
        const rows = await dbAll(`
            SELECT ar.internal_id as id, ar.name,
                   (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount,
                   (SELECT COUNT(DISTINCT t.id) FROM tracks t WHERE t.artist_id = ar.id) as trackCount
            FROM favourite_artists fa
            JOIN artists ar ON ar.id = fa.artist_id
            WHERE fa.user_id = ?
            ORDER BY ar.name ASC
        `, userId);
        return rows.map((a) => ({
            id: a.id, name: a.name, albumCount: a.albumCount,
            trackCount: a.trackCount, coverArt: `/api/art/artist/${a.id}`,
            provider: "telegram",
        }));
    }

    // ─── Favourite Albums ─────────────────────────────────

    async toggleFavoriteAlbum(userId, albumInternalId) {
        const album = await dbGet("SELECT id FROM albums WHERE internal_id = ?", albumInternalId);
        if (!album) return false;
        const existing = await dbGet("SELECT 1 FROM favourite_albums WHERE user_id = ? AND album_id = ?", userId, album.id);
        if (existing) {
            await dbRun("DELETE FROM favourite_albums WHERE user_id = ? AND album_id = ?", userId, album.id);
            return false;
        } else {
            await dbRun("INSERT INTO favourite_albums (user_id, album_id) VALUES (?, ?)", userId, album.id);
            return true;
        }
    }

    async checkFavoriteAlbums(userId, albumInternalIds) {
        const result = {};
        for (const internalId of albumInternalIds) {
            const album = await dbGet("SELECT id FROM albums WHERE internal_id = ?", internalId);
            if (!album) { result[internalId] = false; continue; }
            const exists = await dbGet("SELECT 1 FROM favourite_albums WHERE user_id = ? AND album_id = ?", userId, album.id);
            result[internalId] = !!exists;
        }
        return result;
    }

    async getFavouriteAlbums(userId) {
        const rows = await dbAll(`
            SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                   ar.name as artist, ar.internal_id as artistId,
                   (SELECT COUNT(*) FROM tracks WHERE album_id = a.id) as songCount,
                   (SELECT COALESCE(SUM(duration), 0) FROM tracks WHERE album_id = a.id) as duration
            FROM favourite_albums fa
            JOIN albums a ON a.id = fa.album_id
            LEFT JOIN artists ar ON ar.id = a.artist_id
            WHERE fa.user_id = ?
            ORDER BY a.name ASC
        `, userId);
        return rows.map((r) => ({
            id: r.id, name: r.name, artist: r.artist || "Unknown", artistId: r.artistId,
            year: r.year || 0, coverUrl: r.coverUrl || `/api/art/${r.id}`,
            songCount: r.songCount, duration: r.duration, provider: "telegram",
        }));
    }

    // ─── Smart Playlists ──────────────────────────────────

    async createSmartPlaylist(userId, name, ruleType, ruleLimit = 50) {
        const { generateId } = require("../db/ids");
        const internalId = generateId("spl");
        await dbRun("INSERT INTO smart_playlists (internal_id, user_id, name, rule_type, rule_limit) VALUES (?, ?, ?, ?, ?)", internalId, userId, name, ruleType, ruleLimit);
        return { id: internalId, name, ruleType, ruleLimit };
    }

    async getUserSmartPlaylists(userId) {
        const rows = await dbAll("SELECT * FROM smart_playlists WHERE user_id = ? ORDER BY created_at DESC", userId);
        return rows.map((r) => ({
            id: r.internal_id, name: r.name, ruleType: r.rule_type, ruleLimit: r.rule_limit,
        }));
    }

    async deleteSmartPlaylist(internalId, userId) {
        const result = await dbRun("DELETE FROM smart_playlists WHERE internal_id = ? AND user_id = ?", internalId, userId);
        return result.changes > 0;
    }

    async evaluateSmartPlaylist(internalId, userId) {
        const sp = await dbGet("SELECT * FROM smart_playlists WHERE internal_id = ? AND user_id = ?", internalId, userId);
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
            rows = await dbAll(query, userId, userId, sp.rule_limit);
        } else {
            rows = await dbAll(query, sp.rule_limit);
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

    async searchFTS5(query) {
        const q = query.trim();
        if (!q) return { songs: [], albums: [], artists: [] };

        try {
            const ftsQuery = q.split(/\s+/).map((w) => `"${w.replace(/"/g, '""')}"`).join(" OR ");

            const songs = await dbAll(`
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
            `, ftsQuery);

            const albums = await dbAll(`
                SELECT a.internal_id as id, a.name, a.year, a.cover_url as coverUrl,
                       ar.name as artist, ar.internal_id as artistId,
                       rank
                FROM albums_fts
                JOIN albums a ON a.id = albums_fts.rowid
                LEFT JOIN artists ar ON ar.id = a.artist_id
                WHERE albums_fts MATCH ?
                ORDER BY rank
                LIMIT 10
            `, ftsQuery);

            const artists = await dbAll(`
                SELECT ar.internal_id as id, ar.name,
                       (SELECT COUNT(DISTINCT a.id) FROM albums a WHERE a.artist_id = ar.id) as albumCount,
                       rank
                FROM artists_fts
                JOIN artists ar ON ar.id = artists_fts.rowid
                WHERE artists_fts MATCH ?
                ORDER BY rank
                LIMIT 10
            `, ftsQuery);

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
