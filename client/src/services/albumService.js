import { apiClient } from "./apiClient";

export const albumService = {
    async getAlbums(offset = 0) {
        return apiClient.get(`/api/albums?offset=${offset}`);
    },

    async getAlbum(id) {
        const rawId = id.includes(":") ? id.split(":").pop() : id;
        return apiClient.get(`/api/albums/${rawId}`);
    },

    async getRecent(size = 12) {
        return apiClient.get(`/api/albums/recent?size=${size}`);
    },

    async getNewest(size = 12) {
        return apiClient.get(`/api/albums/newest?size=${size}`);
    },

    async getFrequent(size = 12) {
        return apiClient.get(`/api/albums/frequent?size=${size}`);
    },
};
