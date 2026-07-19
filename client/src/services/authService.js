import { apiClient } from "./apiClient";

export const authService = {
    async login(serverUrl, username, password, providerId = "navidrome") {
        let body;
        if (providerId === "telegram") {
            body = { providerId: "telegram" };
        } else {
            body = {
                providerId: "navidrome",
                config: { serverUrl, username, password },
            };
        }
        const data = await apiClient.post("/api/auth/login", body);
        if (data.token) {
            apiClient.setToken(data.token);
        }
        return data;
    },

    async me() {
        return apiClient.get("/api/auth/me");
    },

    async autoTelegramLogin() {
        try {
            const data = await apiClient.post("/api/auth/login", {
                providerId: "telegram",
            });
            if (data.token) {
                apiClient.setToken(data.token);
            }
            return data;
        } catch {
            return null;
        }
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
