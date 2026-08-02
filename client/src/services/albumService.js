import { apiClient } from "./apiClient";
import { cacheService } from "./cacheService";

export const albumService = {
    async getAlbums(offset = 0, forceRefresh = false) {
        return cacheService.fetchCached(`albums_${offset}`, () => apiClient.get(`/api/albums?offset=${offset}`), { forceRefresh });
    },

    async getAlbum(id, forceRefresh = false) {
        const rawId = id.includes(":") ? id.split(":").pop() : id;
        return cacheService.fetchCached(`album_detail_${rawId}`, () => apiClient.get(`/api/albums/${rawId}`), { forceRefresh });
    },

    async getRecent(size = 12, forceRefresh = false) {
        return cacheService.fetchCached(`albums_recent_${size}`, () => apiClient.get(`/api/albums/recent?size=${size}`), { forceRefresh });
    },

    async getNewest(size = 12, forceRefresh = false) {
        return cacheService.fetchCached(`albums_newest_${size}`, () => apiClient.get(`/api/albums/newest?size=${size}`), { forceRefresh });
    },

    async getFrequent(size = 12, forceRefresh = false) {
        return cacheService.fetchCached(`albums_frequent_${size}`, () => apiClient.get(`/api/albums/frequent?size=${size}`), { forceRefresh });
    },
};
