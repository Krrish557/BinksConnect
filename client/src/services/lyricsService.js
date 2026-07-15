import { apiClient } from "./apiClient";

class LyricsService {
    async getLyrics(trackInternalId) {
        try {
            const res = await apiClient.request("GET", `/api/lyrics/${trackInternalId}`);
            return res;
        } catch {
            return { synced: false, plain: "", syncedLines: [], notFound: true };
        }
    }
}

export const lyricsService = new LyricsService();
