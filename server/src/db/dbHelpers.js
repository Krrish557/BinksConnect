const { getDatabase } = require("./database");

function normalizeArgs(params) {
    if (params.length === 1 && params[0] !== null && typeof params[0] === "object" && !Array.isArray(params[0])) {
        return params[0];
    }
    return params;
}

async function dbGet(sql, ...params) {
    const { type, client } = getDatabase();
    if (type === "turso") {
        const result = await client.execute({ sql, args: normalizeArgs(params) });
        return result.rows[0] || null;
    }
    return client.prepare(sql).get(...params);
}

async function dbAll(sql, ...params) {
    const { type, client } = getDatabase();
    if (type === "turso") {
        const result = await client.execute({ sql, args: normalizeArgs(params) });
        return result.rows;
    }
    return client.prepare(sql).all(...params);
}

async function dbRun(sql, ...params) {
    const { type, client } = getDatabase();
    if (type === "turso") {
        const result = await client.execute({ sql, args: normalizeArgs(params) });
        return {
            changes: result.rowsAffected,
            lastInsertRowid: Number(result.lastInsertRowid || 0),
        };
    }
    const result = client.prepare(sql).run(...params);
    return {
        changes: result.changes,
        lastInsertRowid: Number(result.lastInsertRowid),
    };
}

async function dbExec(sql) {
    const { type, client } = getDatabase();
    if (type === "turso") {
        await client.executeMultiple(sql);
    } else {
        client.exec(sql);
    }
}

async function dbTransaction(fn) {
    const { type, client } = getDatabase();
    if (type === "turso") {
        return fn();
    }
    if (fn.constructor.name === "AsyncFunction") {
        client.prepare("BEGIN").run();
        try {
            const result = await fn();
            client.prepare("COMMIT").run();
            return result;
        } catch (err) {
            client.prepare("ROLLBACK").run();
            throw err;
        }
    }
    const txFn = client.transaction(fn);
    return txFn();
}

module.exports = { dbGet, dbAll, dbRun, dbExec, dbTransaction };
