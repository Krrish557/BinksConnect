import { apiClient } from "./apiClient";

export const trackService = {
    async getTracks(offset = 0) {
        return apiClient.get(`/api/tracks?offset=${offset}`);
    },

    async getRandom(size = 20) {
        return apiClient.get(`/api/tracks/random?size=${size}`);
    },

    async getStarred() {
        return apiClient.get("/api/starred");
    },

    async toggleFavorite(trackId) {
        return apiClient.post("/api/favorites/toggle", { trackId });
    },

    async checkFavorites(trackIds) {
        return apiClient.post("/api/favorites/check", { trackIds });
    },

    getStreamUrl(trackId) {
        return apiClient.getStreamUrl(trackId);
    },
};
