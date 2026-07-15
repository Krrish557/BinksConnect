const { createTestDb, clearDb } = require("./helpers");

jest.mock("../db/database");
const database = require("../db/database");

let testDb;

const lyricsService = require("../services/lyricsService");

beforeAll(() => {
    testDb = createTestDb();
    database.getDatabase.mockImplementation(() => ({ type: "sqlite", client: testDb }));
});

beforeEach(() => {
    clearDb(testDb);
});

describe("LRC Parsing (via fetchLyrics with cache)", () => {
    test("caches and retrieves plain lyrics", async () => {
        const dbId = testDb.prepare(
            "INSERT INTO tracks (internal_id, title, artist_id) VALUES (?, ?, NULL) RETURNING id"
        ).get("trk_test1", "Test Song").id;

        testDb.prepare(
            "INSERT INTO lyrics_cache (track_id, provider, synced, plain, synced_json) VALUES (?, ?, 0, ?, NULL)"
        ).run(dbId, "test", "Hello world");

        const result = await lyricsService.fetchLyrics("Any", "Test Song", null, 200, dbId);
        expect(result).not.toBeNull();
        expect(result.plain).toBe("Hello world");
        expect(result.synced).toBe(false);
    });

    test("returns cached synced lyrics", async () => {
        const dbId = testDb.prepare(
            "INSERT INTO tracks (internal_id, title, artist_id) VALUES (?, ?, NULL) RETURNING id"
        ).get("trk_test2", "Synced Song").id;

        const lines = JSON.stringify([
            { time: 0, text: "Line 1" },
            { time: 4, text: "Line 2" },
        ]);
        testDb.prepare(
            "INSERT INTO lyrics_cache (track_id, provider, synced, plain, synced_json) VALUES (?, ?, 1, ?, ?)"
        ).run(dbId, "test", "Line 1\nLine 2", lines);

        const result = await lyricsService.fetchLyrics("Any", "Synced Song", null, 200, dbId);
        expect(result.synced).toBe(true);
        expect(result.syncedLines.length).toBe(2);
        expect(result.syncedLines[0].text).toBe("Line 1");
    });

    test("handles corrupted JSON in cache gracefully", async () => {
        const dbId = testDb.prepare(
            "INSERT INTO tracks (internal_id, title, artist_id) VALUES (?, ?, NULL) RETURNING id"
        ).get("trk_test3", "Corrupt Song").id;

        testDb.prepare(
            "INSERT INTO lyrics_cache (track_id, provider, synced, plain, synced_json) VALUES (?, ?, 1, 'text', 'not-valid-json')"
        ).run(dbId, "test");

        const result = await lyricsService.fetchLyrics("Any", "Corrupt Song", null, 200, dbId);
        expect(result).not.toBeNull();
        expect(result.syncedLines).toEqual([]);
    });

    test("returns cached instrumental flag", async () => {
        const dbId = testDb.prepare(
            "INSERT INTO tracks (internal_id, title, artist_id) VALUES (?, ?, NULL) RETURNING id"
        ).get("trk_test4", "Instrumental").id;

        testDb.prepare(
            "INSERT INTO lyrics_cache (track_id, provider, synced, plain, synced_json) VALUES (?, ?, 0, '__instrumental__', NULL)"
        ).run(dbId, "test");

        const result = await lyricsService.fetchLyrics("Any", "Instrumental", null, 200, dbId);
        expect(result.instrumental).toBe(true);
    });

    test("returns null when no artist or title", async () => {
        expect(await lyricsService.fetchLyrics(null, "Song", null, 200, null)).toBeNull();
        expect(await lyricsService.fetchLyrics("Artist", null, null, 200, null)).toBeNull();
    });
});
