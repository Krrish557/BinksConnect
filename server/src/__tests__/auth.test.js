const request = require("supertest");
const bcrypt = require("bcryptjs");
const { createTestDb, clearDb } = require("./helpers");

jest.mock("../db/database");
jest.mock("../telegram/bot", () => ({ startPolling: jest.fn() }));
jest.mock("../cache/audioCache", () => ({ initCache: jest.fn() }));
jest.mock("../routes/uploadRoutes", () => {
    const express = require("express");
    return express.Router();
});
jest.mock("../providers/manager", () => ({ getProvider: jest.fn() }));
jest.mock("../providers/telegram", () => {
    return jest.fn().mockImplementation(() => ({
        download: jest.fn(),
        delete: jest.fn(),
        exists: jest.fn(),
        health: jest.fn(),
    }));
});
jest.mock("../services/emailService", () => ({
    sendMail: jest.fn(),
    sendOtp: jest.fn(),
    sendPasswordReset: jest.fn(),
}));
const emailService = require("../services/emailService");
const database = require("../db/database");

let testDb;
let app;
let emailCounter = 0;

beforeAll(() => {
    testDb = createTestDb();
    database.getDatabase.mockImplementation(() => ({ type: "sqlite", client: testDb }));
    app = require("../../server");
});

beforeEach(() => {
    clearDb(testDb);
    jest.clearAllMocks();
    emailService.sendOtp.mockImplementation((to, code) => {
        global.__lastOtp = code;
        return Promise.resolve();
    });
    emailService.sendPasswordReset.mockImplementation((to, link) => {
        global.__lastResetLink = link;
        return Promise.resolve();
    });
});

function uniqueEmail() {
    emailCounter += 1;
    return `user${emailCounter}_${Date.now()}@example.com`;
}

async function register(email) {
    const res = await request(app).post("/api/auth/register").send({
        username: `bob_${emailCounter}_${Date.now()}`,
        email,
        password: "password123",
    });
    return res;
}

async function registerAndVerify() {
    const email = uniqueEmail();
    await register(email);
    const otp = global.__lastOtp;
    const verify = await request(app).post("/api/auth/verify-otp").send({ email, code: otp });
    expect(verify.status).toBe(200);
    return email;
}

describe("Auth / Register", () => {
    test("POST /api/auth/register — creates pending user and emails OTP", async () => {
        const email = uniqueEmail();
        const res = await register(email);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(global.__lastOtp).toMatch(/^\d{6}$/);

        const user = testDb.prepare("SELECT email_verified FROM users WHERE email = ?").get(email);
        expect(user.email_verified).toBe(0);
    });

    test("POST /api/auth/register — rejects duplicate username", async () => {
        const email = uniqueEmail();
        const username = `dupe_${emailCounter}_${Date.now()}`;
        const first = await request(app).post("/api/auth/register").send({
            username,
            email,
            password: "password123",
        });
        expect(first.status).toBe(201);
        const res = await request(app).post("/api/auth/register").send({
            username,
            email: uniqueEmail(),
            password: "password123",
        });
        expect(res.status).toBe(409);
    });

    test("POST /api/auth/register — rejects duplicate email", async () => {
        const email = uniqueEmail();
        await register(email);
        const res = await request(app).post("/api/auth/register").send({
            username: "otheruser",
            email,
            password: "password123",
        });
        expect(res.status).toBe(409);
    });

    test("POST /api/auth/register — rejects invalid email", async () => {
        const res = await request(app).post("/api/auth/register").send({
            username: "bob_invalid",
            email: "not-an-email",
            password: "password123",
        });
        expect(res.status).toBe(400);
    });

    test("POST /api/auth/register — rejects short password", async () => {
        const res = await request(app).post("/api/auth/register").send({
            username: "bob_short",
            email: uniqueEmail(),
            password: "short",
        });
        expect(res.status).toBe(400);
    });
});

describe("Auth / OTP", () => {
    test("POST /api/auth/verify-otp — marks email verified", async () => {
        const email = uniqueEmail();
        await register(email);
        const res = await request(app).post("/api/auth/verify-otp").send({ email, code: global.__lastOtp });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const user = testDb.prepare("SELECT email_verified FROM users WHERE email = ?").get(email);
        expect(user.email_verified).toBe(1);
    });

    test("POST /api/auth/verify-otp — rejects wrong code", async () => {
        const email = uniqueEmail();
        await register(email);
        const res = await request(app).post("/api/auth/verify-otp").send({ email, code: "000000" });
        expect(res.status).toBe(400);
    });

    test("POST /api/auth/resend-otp — issues a new code", async () => {
        const email = uniqueEmail();
        await register(email);
        const first = global.__lastOtp;
        const res = await request(app).post("/api/auth/resend-otp").send({ email });
        expect(res.status).toBe(200);
        expect(global.__lastOtp).toMatch(/^\d{6}$/);
        expect(global.__lastOtp).not.toBe(first);
    });
});

describe("Auth / Login", () => {
    test("POST /api/auth/login — logs in with username", async () => {
        const email = await registerAndVerify();
        const username = testDb.prepare("SELECT username FROM users WHERE email = ?").get(email).username;
        const res = await request(app).post("/api/auth/login").send({ identifier: username, password: "password123" });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.username).toBe(username);
    });

    test("POST /api/auth/login — logs in with email", async () => {
        const email = await registerAndVerify();
        const res = await request(app).post("/api/auth/login").send({ identifier: email, password: "password123" });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
    });

    test("POST /api/auth/login — rejects wrong password", async () => {
        const email = await registerAndVerify();
        const res = await request(app).post("/api/auth/login").send({ identifier: email, password: "wrongpassword" });
        expect(res.status).toBe(401);
    });

    test("POST /api/auth/login — rejects unverified email", async () => {
        const email = uniqueEmail();
        await register(email);
        const res = await request(app).post("/api/auth/login").send({ identifier: email, password: "password123" });
        expect(res.status).toBe(403);
    });
});

describe("Auth / Password Reset", () => {
    test("POST /api/auth/forgot-password — emails reset link", async () => {
        const email = await registerAndVerify();
        const res = await request(app).post("/api/auth/forgot-password").send({ email });
        expect(res.status).toBe(200);
        expect(global.__lastResetLink).toMatch(/\/reset-password\?token=/);
    });

    test("POST /api/auth/forgot-password — returns success for unknown email", async () => {
        const res = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@example.com" });
        expect(res.status).toBe(200);
        expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    test("POST /api/auth/reset-password — updates password and invalidates sessions", async () => {
        const email = await registerAndVerify();
        await request(app).post("/api/auth/forgot-password").send({ email });
        const token = new URL(global.__lastResetLink).searchParams.get("token");

        const loginBefore = await request(app).post("/api/auth/login").send({ identifier: email, password: "password123" });
        expect(loginBefore.status).toBe(200);

        const reset = await request(app).post("/api/auth/reset-password").send({ token, password: "newpassword456" });
        expect(reset.status).toBe(200);
        expect(reset.body.success).toBe(true);

        const user = testDb.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email);
        expect(bcrypt.compareSync("newpassword456", user.password_hash)).toBe(true);
        expect(bcrypt.compareSync("password123", user.password_hash)).toBe(false);

        const sessions = testDb.prepare("SELECT COUNT(*) as c FROM sessions WHERE user_id = ?").get(user.id).c;
        expect(sessions).toBe(0);
    });

    test("POST /api/auth/reset-password — rejects invalid token", async () => {
        const res = await request(app).post("/api/auth/reset-password").send({ token: "bogus", password: "newpassword456" });
        expect(res.status).toBe(400);
    });

    test("POST /api/auth/reset-password — rejects short password", async () => {
        const res = await request(app).post("/api/auth/reset-password").send({ token: "bogus", password: "short" });
        expect(res.status).toBe(400);
    });
});
