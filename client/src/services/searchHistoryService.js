/**
 * Search History Service
 * Manages user's recent search queries persistently in localStorage.
 */

const STORAGE_KEY = "binks_search_history";
const MAX_HISTORY = 10;

export const searchHistoryService = {
    getHistory() {
        if (typeof window === "undefined") return [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    addSearch(query) {
        if (!query || typeof query !== "string") return [];
        const trimmed = query.trim();
        if (!trimmed || trimmed.length < 2) return this.getHistory();

        const current = this.getHistory();
        const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error("Save search history error:", err);
        }
        return updated;
    },

    removeSearch(query) {
        if (typeof window === "undefined") return [];
        const current = this.getHistory();
        const updated = current.filter((item) => item.toLowerCase() !== query.toLowerCase());
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error("Remove search history error:", err);
        }
        return updated;
    },

    clearHistory() {
        if (typeof window === "undefined") return [];
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            console.error("Clear search history error:", err);
        }
        return [];
    },
};
