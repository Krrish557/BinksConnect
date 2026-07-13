import { apiClient } from "./apiClient";

export const searchService = {
    async search(query) {
        return apiClient.get(`/api/search?q=${encodeURIComponent(query)}`);
    },
};
