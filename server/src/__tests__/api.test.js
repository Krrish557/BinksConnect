const request = require("supertest");
const { createTestDb, clearDb, seedTestData } = require("./helpers");

jest.mock("../db/database");
jest.mock("../telegram/bot", () => ({ startPolling: jest.fn() }));
jest.mock("../cache/audioCache", () => ({ initCache: jest.fn() }));
jest.mock("../routes/uploadRoutes", () => {
    const express = require("express");
    return express.Router();
});
jest.mock("../providers/manager", () => ({
    getProvider: jest.fn(),
}));
jest.mock("../providers/telegram", () => {
    return jest.fn().mockImplementation(() => ({
        download: jest.fn(),
        delete: jest.fn(),
        exists: jest.fn(),
        health: jest.fn(),
    }));
});
const database = require("../db/database");

let testDb;
let app;
let seed;

beforeAll(() => {
    testDb = createTestDb();
    database.getDatabase.mockImplementation(() => ({ type: "sqlite", client: testDb }));
    app = require("../../server");
});

beforeEach(() => {
    clearDb(testDb);
    seed = seedTestData(testDb);
});

function authReq(method, path) {
    const auth = require("../middleware/auth");
    return request(app)[method](path).set("Authorization", `Bearer ${auth.generateToken(seed.sessionId, seed.userId)}`);
}

describe("Playlists API", () => {
    test("POST /api/playlists — creates playlist", async () => {
        const res = await authReq("post", "/api/playlists").send({ name: "Test Playlist" });
        expect(res.status).toBe(200);
        expect(res.body.id).toMatch(/^pl_/);
        expect(res.body.name).toBe("Test Playlist");
    });

    test("POST /api/playlists — rejects empty name", async () => {
        const res = await authReq("post", "/api/playlists").send({ name: "" });
        expect(res.status).toBe(400);
    });

    test("GET /api/playlists — lists playlists", async () => {
        await authReq("post", "/api/playlists").send({ name: "PL1" });
        await authReq("post", "/api/playlists").send({ name: "PL2" });
        const res = await authReq("get", "/api/playlists");
        expect(res.status).toBe(200);
        expect(res.body.playlists.length).toBe(2);
    });

    test("GET /api/playlists/:id — returns playlist with tracks", async () => {
        const create = await authReq("post", "/api/playlists").send({ name: "PL" });
        await authReq("post", `/api/playlists/${create.body.id}/tracks`).send({ trackId: seed.trackId1 });
        const res = await authReq("get", `/api/playlists/${create.body.id}`);
        expect(res.status).toBe(200);
        expect(res.body.tracks.length).toBe(1);
    });

    test("GET /api/playlists/:id — 404 for missing", async () => {
        const res = await authReq("get", "/api/playlists/pl_nope");
        expect(res.status).toBe(404);
    });

    test("PUT /api/playlists/:id — renames", async () => {
        const create = await authReq("post", "/api/playlists").send({ name: "Old" });
        const res = await authReq("put", `/api/playlists/${create.body.id}`).send({ name: "New" });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test("DELETE /api/playlists/:id — deletes", async () => {
        const create = await authReq("post", "/api/playlists").send({ name: "Del" });
        const res = await authReq("delete", `/api/playlists/${create.body.id}`);
        expect(res.status).toBe(200);
        const getRes = await authReq("get", `/api/playlists/${create.body.id}`);
        expect(getRes.status).toBe(404);
    });

    test("POST /api/playlists/:id/tracks — adds track", async () => {
        const create = await authReq("post", "/api/playlists").send({ name: "PL" });
        const res = await authReq("post", `/api/playlists/${create.body.id}/tracks`).send({ trackId: seed.trackId1 });
        expect(res.status).toBe(200);
    });

    test("DELETE /api/playlists/:id/tracks/:trackId — removes track", async () => {
        const create = await authReq("post", "/api/playlists").send({ name: "PL" });
        await authReq("post", `/api/playlists/${create.body.id}/tracks`).send({ trackId: seed.trackId1 });
        const res = await authReq("delete", `/api/playlists/${create.body.id}/tracks/${seed.trackId1}`);
        expect(res.status).toBe(200);
    });

    test("PUT /api/playlists/:id/reorder — reorders tracks", async () => {
        const create = await authReq("post", "/api/playlists").send({ name: "PL" });
        await authReq("post", `/api/playlists/${create.body.id}/tracks`).send({ trackId: seed.trackId1 });
        await authReq("post", `/api/playlists/${create.body.id}/tracks`).send({ trackId: seed.trackId2 });
        const res = await authReq("put", `/api/playlists/${create.body.id}/reorder`).send({ trackIds: [seed.trackId2, seed.trackId1] });
        expect(res.status).toBe(200);
    });

    test("PUT /api/playlists/:id/reorder — rejects empty trackIds", async () => {
        const create = await authReq("post", "/api/playlists").send({ name: "PL" });
        const res = await authReq("put", `/api/playlists/${create.body.id}/reorder`).send({ trackIds: [] });
        expect(res.status).toBe(400);
    });
});

describe("Favorites API", () => {
    test("POST /api/favorites/toggle — toggles favorite", async () => {
        const res = await authReq("post", "/api/favorites/toggle").send({ trackId: seed.trackId1 });
        expect(res.status).toBe(200);
        expect(res.body.isFavorited).toBe(true);
    });

    test("POST /api/favorites/check — checks favorites", async () => {
        await authReq("post", "/api/favorites/toggle").send({ trackId: seed.trackId1 });
        const res = await authReq("post", "/api/favorites/check").send({ trackIds: [seed.trackId1, seed.trackId2] });
        expect(res.status).toBe(200);
        expect(res.body.favorited[seed.trackId1]).toBe(true);
        expect(res.body.favorited[seed.trackId2]).toBe(false);
    });

    test("POST /api/favorites/check — rejects >100 trackIds", async () => {
        const ids = Array.from({ length: 101 }, (_, i) => `trk_${i}`);
        const res = await authReq("post", "/api/favorites/check").send({ trackIds: ids });
        expect(res.status).toBe(400);
    });

    test("POST /api/favorites/artists/toggle — toggles artist favourite", async () => {
        const res = await authReq("post", "/api/favorites/artists/toggle").send({ artistId: seed.artistId1 });
        expect(res.status).toBe(200);
        expect(res.body.isFavorited).toBe(true);
    });

    test("POST /api/favorites/albums/toggle — toggles album favourite", async () => {
        const res = await authReq("post", "/api/favorites/albums/toggle").send({ albumId: seed.albumId1 });
        expect(res.status).toBe(200);
        expect(res.body.isFavorited).toBe(true);
    });
});

describe("Smart Playlists API", () => {
    test("POST /api/smart-playlists — creates", async () => {
        const res = await authReq("post", "/api/smart-playlists").send({ name: "Top", ruleType: "most_played", ruleLimit: 10 });
        expect(res.status).toBe(200);
        expect(res.body.id).toMatch(/^spl_/);
    });

    test("POST /api/smart-playlists — rejects invalid ruleType", async () => {
        const res = await authReq("post", "/api/smart-playlists").send({ name: "Bad", ruleType: "invalid_type" });
        expect(res.status).toBe(400);
    });

    test("POST /api/smart-playlists — clamps ruleLimit", async () => {
        const res = await authReq("post", "/api/smart-playlists").send({ name: "Clamp", ruleType: "random", ruleLimit: -5 });
        expect(res.status).toBe(200);
    });

    test("GET /api/smart-playlists — lists", async () => {
        await authReq("post", "/api/smart-playlists").send({ name: "SP1", ruleType: "random" });
        const res = await authReq("get", "/api/smart-playlists");
        expect(res.status).toBe(200);
        expect(res.body.playlists.length).toBe(1);
    });

    test("GET /api/smart-playlists/:id — evaluates", async () => {
        const create = await authReq("post", "/api/smart-playlists").send({ name: "Rand", ruleType: "random", ruleLimit: 10 });
        const res = await authReq("get", `/api/smart-playlists/${create.body.id}`);
        expect(res.status).toBe(200);
        expect(res.body.tracks.length).toBe(3);
    });

    test("DELETE /api/smart-playlists/:id — deletes", async () => {
        const create = await authReq("post", "/api/smart-playlists").send({ name: "Del", ruleType: "random" });
        const res = await authReq("delete", `/api/smart-playlists/${create.body.id}`);
        expect(res.status).toBe(200);
    });

    test("DELETE /api/smart-playlists/:id — 404 for missing", async () => {
        const res = await authReq("delete", "/api/smart-playlists/spl_nope");
        expect(res.status).toBe(404);
    });
});

describe("Search API", () => {
    test("GET /api/search?q=... — returns results", async () => {
        const res = await authReq("get", "/api/search?q=Alpha");
        expect(res.status).toBe(200);
        expect(res.body.songs.length).toBe(1);
    });

    test("GET /api/search?q=... — empty query returns empty", async () => {
        const res = await authReq("get", "/api/search?q=");
        expect(res.status).toBe(200);
        expect(res.body.songs).toEqual([]);
    });

    test("GET /api/search — rejects >200 char query", async () => {
        const longQuery = "a".repeat(201);
        const res = await authReq("get", `/api/search?q=${longQuery}`);
        expect(res.status).toBe(400);
    });
});

describe("Lyrics API", () => {
    test("GET /api/lyrics/:id — returns notFound for unknown track", async () => {
        const res = await authReq("get", "/api/lyrics/trk_nonexistent");
        expect(res.status).toBe(404);
    });

    test("GET /api/lyrics/:id — returns lyrics or notFound for valid track", async () => {
        const res = await authReq("get", `/api/lyrics/${seed.trackId1}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("synced");
    });

    test("GET /api/lyrics/:id — requires auth", async () => {
        const res = await request(app).get(`/api/lyrics/${seed.trackId1}`);
        expect(res.status).toBe(401);
    });
});

describe("Auth", () => {
    test("unauthenticated requests return 401", async () => {
        const res = await request(app).get("/api/playlists");
        expect(res.status).toBe(401);
    });

    test("invalid token returns 401", async () => {
        const res = await request(app).get("/api/playlists").set("Authorization", "Bearer invalid_token");
        expect(res.status).toBe(401);
    });
});
