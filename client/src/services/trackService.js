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

    getStreamUrl(trackId) {
        return apiClient.getStreamUrl(trackId);
    },
};
