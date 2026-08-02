import { apiClient } from "./apiClient";
import { cacheService } from "./cacheService";

export const artistService = {
    async getArtists(forceRefresh = false) {
        return cacheService.fetchCached("artists_all", () => apiClient.get("/api/artists"), { forceRefresh });
    },

    async getArtist(id, forceRefresh = false) {
        const rawId = id.includes(":") ? id.split(":").pop() : id;
        return cacheService.fetchCached(`artist_detail_${rawId}`, () => apiClient.get(`/api/artists/${rawId}`), { forceRefresh });
    },
};
