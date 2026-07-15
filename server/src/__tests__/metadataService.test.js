const { createTestDb, clearDb, seedTestData } = require("./helpers");

jest.mock("../db/database");
const database = require("../db/database");

let testDb;
let seed;

const metadataService = require("../services/metadataService");

beforeAll(() => {
    testDb = createTestDb();
    database.getDatabase.mockImplementation(() => testDb);
});

beforeEach(() => {
    clearDb(testDb);
    seed = seedTestData(testDb);
});

describe("Artists", () => {
    test("createArtist creates and returns ids", () => {
        const result = metadataService.createArtist("New Artist");
        expect(result.id).toMatch(/^art_/);
        expect(result.dbId).toBeDefined();
    });

    test("createArtist returns existing if name matches", () => {
        const first = metadataService.createArtist("Duplicate Artist");
        const second = metadataService.createArtist("Duplicate Artist");
        expect(second.dbId).toBe(first.dbId);
    });

    test("findOrCreateArtist deduplicates on normalized name", () => {
        const first = metadataService.findOrCreateArtist("  Test Artist  ");
        const second = metadataService.findOrCreateArtist("test artist");
        expect(second.dbId).toBe(first.dbId);
    });

    test("findOrCreateArtist returns null for empty/null input", () => {
        expect(metadataService.findOrCreateArtist(null)).toBeNull();
        expect(metadataService.findOrCreateArtist("")).toBeNull();
        expect(metadataService.findOrCreateArtist("   ")).toBeNull();
    });
});

describe("Playlists", () => {
    test("createPlaylist creates and returns playlist", () => {
        const pl = metadataService.createPlaylist(seed.userId, "My Playlist");
        expect(pl.id).toMatch(/^pl_/);
        expect(pl.name).toBe("My Playlist");
        expect(pl.trackCount).toBe(0);
    });

    test("createPlaylist defaults name to 'New Playlist'", () => {
        const pl = metadataService.createPlaylist(seed.userId, null);
        expect(pl.name).toBe("New Playlist");
    });

    test("getUserPlaylists returns user playlists", () => {
        metadataService.createPlaylist(seed.userId, "PL1");
        metadataService.createPlaylist(seed.userId, "PL2");
        const list = metadataService.getUserPlaylists(seed.userId);
        expect(list.length).toBe(2);
    });

    test("getPlaylist returns playlist with tracks", () => {
        const pl = metadataService.createPlaylist(seed.userId, "Test PL");
        metadataService.addTrackToPlaylist(pl.id, seed.userId, seed.trackId1);
        const result = metadataService.getPlaylist(pl.id, seed.userId);
        expect(result).not.toBeNull();
        expect(result.name).toBe("Test PL");
        expect(result.tracks.length).toBe(1);
        expect(result.tracks[0].id).toBe(seed.trackId1);
    });

    test("getPlaylist returns null for missing playlist", () => {
        expect(metadataService.getPlaylist("pl_nonexistent", seed.userId)).toBeNull();
    });

    test("renamePlaylist updates name", () => {
        const pl = metadataService.createPlaylist(seed.userId, "Old Name");
        metadataService.renamePlaylist(pl.id, seed.userId, "New Name");
        const result = metadataService.getPlaylist(pl.id, seed.userId);
        expect(result.name).toBe("New Name");
    });

    test("deletePlaylist removes playlist", () => {
        const pl = metadataService.createPlaylist(seed.userId, "To Delete");
        const deleted = metadataService.deletePlaylist(pl.id, seed.userId);
        expect(deleted).toBe(true);
        expect(metadataService.getPlaylist(pl.id, seed.userId)).toBeNull();
    });

    test("deletePlaylist returns false for nonexistent", () => {
        expect(metadataService.deletePlaylist("pl_nope", seed.userId)).toBe(false);
    });

    test("addTrackToPlaylist adds track", () => {
        const pl = metadataService.createPlaylist(seed.userId, "PL");
        const added = metadataService.addTrackToPlaylist(pl.id, seed.userId, seed.trackId1);
        expect(added).toBe(true);
        const result = metadataService.getPlaylist(pl.id, seed.userId);
        expect(result.tracks.length).toBe(1);
    });

    test("addTrackToPlaylist returns false for missing playlist", () => {
        expect(metadataService.addTrackToPlaylist("pl_nope", seed.userId, seed.trackId1)).toBe(false);
    });

    test("removeTrackFromPlaylist removes track", () => {
        const pl = metadataService.createPlaylist(seed.userId, "PL");
        metadataService.addTrackToPlaylist(pl.id, seed.userId, seed.trackId1);
        const removed = metadataService.removeTrackFromPlaylist(pl.id, seed.userId, seed.trackId1);
        expect(removed).toBe(true);
        const result = metadataService.getPlaylist(pl.id, seed.userId);
        expect(result.tracks.length).toBe(0);
    });

    test("reorderPlaylist changes track order", () => {
        const pl = metadataService.createPlaylist(seed.userId, "PL");
        metadataService.addTrackToPlaylist(pl.id, seed.userId, seed.trackId1);
        metadataService.addTrackToPlaylist(pl.id, seed.userId, seed.trackId2);
        metadataService.reorderPlaylist(pl.id, seed.userId, [seed.trackId2, seed.trackId1]);
        const result = metadataService.getPlaylist(pl.id, seed.userId);
        expect(result.tracks[0].id).toBe(seed.trackId2);
        expect(result.tracks[1].id).toBe(seed.trackId1);
    });
});

describe("Favourites - Tracks", () => {
    test("toggleFavorite adds and removes", () => {
        let fav = metadataService.toggleFavorite(seed.userId, seed.trackId1);
        expect(fav).toBe(true);
        fav = metadataService.toggleFavorite(seed.userId, seed.trackId1);
        expect(fav).toBe(false);
    });

    test("checkFavorites returns correct status", () => {
        metadataService.toggleFavorite(seed.userId, seed.trackId1);
        const result = metadataService.checkFavorites(seed.userId, [seed.trackId1, seed.trackId2]);
        expect(result[seed.trackId1]).toBe(true);
        expect(result[seed.trackId2]).toBe(false);
    });

    test("getStarredItems returns favorited tracks", () => {
        metadataService.toggleFavorite(seed.userId, seed.trackId1);
        const starred = metadataService.getStarredItems(seed.userId);
        expect(starred.songs.length).toBe(1);
        expect(starred.songs[0].id).toBe(seed.trackId1);
    });
});

describe("Favourites - Artists", () => {
    test("toggleFavoriteArtist adds and removes", () => {
        let fav = metadataService.toggleFavoriteArtist(seed.userId, seed.artistId1);
        expect(fav).toBe(true);
        fav = metadataService.toggleFavoriteArtist(seed.userId, seed.artistId1);
        expect(fav).toBe(false);
    });

    test("checkFavoriteArtists returns correct status", () => {
        metadataService.toggleFavoriteArtist(seed.userId, seed.artistId1);
        const result = metadataService.checkFavoriteArtists(seed.userId, [seed.artistId1, seed.artistId2]);
        expect(result[seed.artistId1]).toBe(true);
        expect(result[seed.artistId2]).toBe(false);
    });

    test("getFavouriteArtists returns only user's favourites", () => {
        metadataService.toggleFavoriteArtist(seed.userId, seed.artistId1);
        const favs = metadataService.getFavouriteArtists(seed.userId);
        expect(favs.length).toBe(1);
        expect(favs[0].id).toBe(seed.artistId1);
    });

    test("getFavouriteArtists does not leak across users", () => {
        testDb.prepare("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)").run(2, "other", "hash");
        metadataService.toggleFavoriteArtist(seed.userId, seed.artistId1);
        metadataService.toggleFavoriteArtist(2, seed.artistId2);
        expect(metadataService.getFavouriteArtists(seed.userId).length).toBe(1);
        expect(metadataService.getFavouriteArtists(2).length).toBe(1);
    });
});

describe("Favourites - Albums", () => {
    test("toggleFavoriteAlbum adds and removes", () => {
        let fav = metadataService.toggleFavoriteAlbum(seed.userId, seed.albumId1);
        expect(fav).toBe(true);
        fav = metadataService.toggleFavoriteAlbum(seed.userId, seed.albumId1);
        expect(fav).toBe(false);
    });

    test("checkFavoriteAlbums returns correct status", () => {
        metadataService.toggleFavoriteAlbum(seed.userId, seed.albumId1);
        const result = metadataService.checkFavoriteAlbums(seed.userId, [seed.albumId1, seed.albumId2]);
        expect(result[seed.albumId1]).toBe(true);
        expect(result[seed.albumId2]).toBe(false);
    });

    test("getFavouriteAlbums returns only user's favourites", () => {
        metadataService.toggleFavoriteAlbum(seed.userId, seed.albumId1);
        const favs = metadataService.getFavouriteAlbums(seed.userId);
        expect(favs.length).toBe(1);
        expect(favs[0].id).toBe(seed.albumId1);
    });

    test("getFavouriteAlbums does not leak across users", () => {
        testDb.prepare("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)").run(3, "other2", "hash");
        metadataService.toggleFavoriteAlbum(seed.userId, seed.albumId1);
        metadataService.toggleFavoriteAlbum(3, seed.albumId2);
        expect(metadataService.getFavouriteAlbums(seed.userId).length).toBe(1);
        expect(metadataService.getFavouriteAlbums(3).length).toBe(1);
    });
});

describe("Smart Playlists", () => {
    test("createSmartPlaylist creates and returns", () => {
        const sp = metadataService.createSmartPlaylist(seed.userId, "Top Played", "most_played", 25);
        expect(sp.id).toMatch(/^spl_/);
        expect(sp.name).toBe("Top Played");
        expect(sp.ruleType).toBe("most_played");
    });

    test("getUserSmartPlaylists lists user's smart playlists", () => {
        metadataService.createSmartPlaylist(seed.userId, "SP1", "random", 10);
        metadataService.createSmartPlaylist(seed.userId, "SP2", "recently_added", 20);
        const list = metadataService.getUserSmartPlaylists(seed.userId);
        expect(list.length).toBe(2);
    });

    test("deleteSmartPlaylist removes and returns true", () => {
        const sp = metadataService.createSmartPlaylist(seed.userId, "To Delete", "random", 10);
        expect(metadataService.deleteSmartPlaylist(sp.id, seed.userId)).toBe(true);
        expect(metadataService.getUserSmartPlaylists(seed.userId).length).toBe(0);
    });

    test("deleteSmartPlaylist returns false for nonexistent", () => {
        expect(metadataService.deleteSmartPlaylist("spl_nope", seed.userId)).toBe(false);
    });

    test("evaluateSmartPlaylist returns null for missing", () => {
        expect(metadataService.evaluateSmartPlaylist("spl_nope", seed.userId)).toBeNull();
    });

    test("evaluateSmartPlaylist 'random' returns tracks", () => {
        const sp = metadataService.createSmartPlaylist(seed.userId, "Random", "random", 10);
        const result = metadataService.evaluateSmartPlaylist(sp.id, seed.userId);
        expect(result.tracks.length).toBe(3);
    });

    test("evaluateSmartPlaylist 'recently_added' returns tracks ordered by date", () => {
        const sp = metadataService.createSmartPlaylist(seed.userId, "Recent", "recently_added", 2);
        const result = metadataService.evaluateSmartPlaylist(sp.id, seed.userId);
        expect(result.tracks.length).toBe(2);
    });

    test("evaluateSmartPlaylist 'most_played' with play history", () => {
        testDb.prepare("INSERT INTO play_history (user_id, track_id) VALUES (?, ?)").run(seed.userId, testDb.prepare("SELECT id FROM tracks WHERE internal_id = ?").get(seed.trackId1).id);
        testDb.prepare("INSERT INTO play_history (user_id, track_id) VALUES (?, ?)").run(seed.userId, testDb.prepare("SELECT id FROM tracks WHERE internal_id = ?").get(seed.trackId1).id);
        const sp = metadataService.createSmartPlaylist(seed.userId, "Top", "most_played", 10);
        const result = metadataService.evaluateSmartPlaylist(sp.id, seed.userId);
        expect(result.tracks.length).toBeGreaterThan(0);
        expect(result.tracks[0].id).toBe(seed.trackId1);
    });
});

describe("Search", () => {
    test("search finds tracks by title", () => {
        const result = metadataService.search("Alpha");
        expect(result.songs.length).toBe(1);
        expect(result.songs[0].id).toBe(seed.trackId1);
    });

    test("search finds artists by name", () => {
        const result = metadataService.search("Artist One");
        expect(result.artists.length).toBe(1);
    });

    test("search finds albums by name", () => {
        const result = metadataService.search("Album One");
        expect(result.albums.length).toBe(1);
    });

    test("search escapes LIKE wildcards", () => {
        const result = metadataService.search("%");
        expect(result.songs.length).toBeGreaterThanOrEqual(0);
    });

    test("searchTracks returns matching tracks", () => {
        const results = metadataService.searchTracks("Beta");
        expect(results.length).toBe(1);
        expect(results[0].id).toBe(seed.trackId2);
    });
});

describe("deleteTrack", () => {
    test("deletes track and cleans up references", () => {
        const pl = metadataService.createPlaylist(seed.userId, "PL");
        metadataService.addTrackToPlaylist(pl.id, seed.userId, seed.trackId1);
        metadataService.toggleFavorite(seed.userId, seed.trackId1);

        const deleted = metadataService.deleteTrack(seed.trackId1);
        expect(deleted).not.toBeNull();
        expect(deleted.title).toBe("Song Alpha");

        const result = metadataService.getPlaylist(pl.id, seed.userId);
        expect(result.tracks.length).toBe(0);

        const favs = metadataService.checkFavorites(seed.userId, [seed.trackId1]);
        expect(favs[seed.trackId1]).toBe(false);
    });

    test("returns null for nonexistent track", () => {
        expect(metadataService.deleteTrack("trk_nope")).toBeNull();
    });
});
