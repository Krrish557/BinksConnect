const buckets = new Map();

function consume(key, limit, windowMs) {
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.start >= windowMs) {
        bucket = { start: now, count: 0, last: now };
        buckets.set(key, bucket);
    }
    bucket.count += 1;
    bucket.last = now;
    return {
        allowed: bucket.count <= limit,
        remaining: Math.max(0, limit - bucket.count),
        retryAfterMs: bucket.start + windowMs - now,
    };
}

function isInCooldown(key, cooldownMs) {
    const bucket = buckets.get(key);
    if (!bucket) return false;
    return Date.now() - bucket.last < cooldownMs;
}

module.exports = { consume, isInCooldown };
