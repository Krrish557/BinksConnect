import { apiClient } from "./apiClient";

class SmartPlaylistService {
    async getSmartPlaylists() {
        const res = await apiClient.get("/api/smart-playlists");
        return res.playlists || [];
    }

    async createSmartPlaylist(name, ruleType, ruleLimit) {
        return apiClient.post("/api/smart-playlists", { name, ruleType, ruleLimit });
    }

    async getSmartPlaylist(id) {
        return apiClient.get(`/api/smart-playlists/${id}`);
    }

    async deleteSmartPlaylist(id) {
        return apiClient.request("DELETE", `/api/smart-playlists/${id}`);
    }
}

export const smartPlaylistService = new SmartPlaylistService();
