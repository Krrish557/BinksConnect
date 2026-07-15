import { apiClient } from "./apiClient";

class PlaylistService {
    async getPlaylists() {
        const res = await apiClient.get("/api/playlists");
        return res.playlists || [];
    }

    async getPlaylist(id) {
        return apiClient.get(`/api/playlists/${id}`);
    }

    async createPlaylist(name) {
        return apiClient.post("/api/playlists", { name });
    }

    async renamePlaylist(id, name) {
        return apiClient.put(`/api/playlists/${id}`, { name });
    }

    async deletePlaylist(id) {
        return apiClient.request("DELETE", `/api/playlists/${id}`);
    }

    async addTrack(playlistId, trackId, position) {
        return apiClient.post(`/api/playlists/${playlistId}/tracks`, { trackId, position });
    }

    async removeTrack(playlistId, trackId) {
        return apiClient.request("DELETE", `/api/playlists/${playlistId}/tracks/${trackId}`);
    }

    async reorderTracks(playlistId, trackIds) {
        return apiClient.put(`/api/playlists/${playlistId}/reorder`, { trackIds });
    }
}

export const playlistService = new PlaylistService();
