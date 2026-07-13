import { apiClient } from "./apiClient";

export const authService = {
    async login(serverUrl, username, password) {
        const data = await apiClient.post("/api/auth/login", {
            providerId: "navidrome",
            config: { serverUrl, username, password },
        });
        if (data.token) {
            apiClient.setToken(data.token);
        }
        return data;
    },

    async me() {
        return apiClient.get("/api/auth/me");
    },

    async logout() {
        try {
            await apiClient.post("/api/auth/logout");
        } catch {
            // Ignore errors on logout
        }
        apiClient.setToken(null);
    },

    loadSession() {
        return apiClient.loadToken();
    },
};
