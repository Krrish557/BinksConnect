import { apiClient } from "./apiClient";
import { cacheService } from "./cacheService";

export const trackService = {
    async getTracks(offset = 0, forceRefresh = false) {
        return cacheService.fetchCached(`tracks_${offset}`, () => apiClient.get(`/api/tracks?offset=${offset}`), { forceRefresh });
    },

    async getRandom(size = 20, forceRefresh = false) {
        return cacheService.fetchCached(`tracks_random_${size}`, () => apiClient.get(`/api/tracks/random?size=${size}`), { forceRefresh, ttlMs: 60 * 1000 });
    },

    async getStarred(forceRefresh = false) {
        return cacheService.fetchCached("tracks_starred", () => apiClient.get("/api/starred"), { forceRefresh });
    },

    async toggleFavorite(trackId) {
        const res = await apiClient.post("/api/favorites/toggle", { trackId });
        cacheService.invalidate("tracks_starred");
        return res;
    },

    async checkFavorites(trackIds) {
        return apiClient.post("/api/favorites/check", { trackIds });
    },

    async getSimilar(trackId, forceRefresh = false) {
        return cacheService.fetchCached(`tracks_similar_${trackId}`, () => apiClient.get(`/api/tracks/similar/${trackId}`), { forceRefresh });
    },

    getStreamUrl(trackId) {
        return apiClient.getStreamUrl(trackId);
    },
};
