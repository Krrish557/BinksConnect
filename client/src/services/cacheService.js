/**
 * Global Client-Side Cache Service
 * Provides instant in-memory caching with Stale-While-Revalidate (SWR) support.
 * Prevents redundant page reloads and network requests when navigating between pages.
 */

const cacheStore = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes default TTL

export const cacheService = {
    /**
     * Get data from cache if present and valid.
     * @param {string} key
     * @param {number} ttlMs
     * @returns {any|null}
     */
    get(key, ttlMs = DEFAULT_TTL_MS) {
        const item = cacheStore.get(key);
        if (!item) return null;

        const isExpired = Date.now() - item.timestamp > ttlMs;
        if (isExpired) {
            // Return stale data for instant rendering while SWR revalidates
            return { data: item.data, isStale: true };
        }

        return { data: item.data, isStale: false };
    },

    /**
     * Set cache entry
     * @param {string} key
     * @param {any} data
     */
    set(key, data) {
        cacheStore.set(key, {
            data,
            timestamp: Date.now(),
        });
    },

    /**
     * Invalidate specific key or prefix
     * @param {string|RegExp} pattern
     */
    invalidate(pattern) {
        if (typeof pattern === "string") {
            cacheStore.delete(pattern);
            // Also invalidate matching keys starting with pattern
            for (const key of cacheStore.keys()) {
                if (key.startsWith(pattern)) {
                    cacheStore.delete(key);
                }
            }
        } else if (pattern instanceof RegExp) {
            for (const key of cacheStore.keys()) {
                if (pattern.test(key)) {
                    cacheStore.delete(key);
                }
            }
        }
    },

    /**
     * Clear all cached data
     */
    clear() {
        cacheStore.clear();
    },

    /**
     * Fetch with cache (Stale-While-Revalidate pattern)
     * @param {string} key
     * @param {Function} fetcherFn
     * @param {Object} options { forceRefresh: boolean, ttlMs: number }
     */
    async fetchCached(key, fetcherFn, options = {}) {
        const { forceRefresh = false, ttlMs = DEFAULT_TTL_MS } = options;

        if (!forceRefresh) {
            const cached = this.get(key, ttlMs);
            if (cached && !cached.isStale) {
                return cached.data;
            }
        }

        try {
            const freshData = await fetcherFn();
            this.set(key, freshData);
            return freshData;
        } catch (err) {
            // Fallback to stale cache if network fails
            const stale = cacheStore.get(key);
            if (stale) {
                return stale.data;
            }
            throw err;
        }
    },
};
