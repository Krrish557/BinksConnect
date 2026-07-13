import { apiClient } from "./apiClient";

export const artistService = {
    async getArtists() {
        return apiClient.get("/api/artists");
    },

    async getArtist(id) {
        const rawId = id.includes(":") ? id.split(":").pop() : id;
        return apiClient.get(`/api/artists/${rawId}`);
    },
};
