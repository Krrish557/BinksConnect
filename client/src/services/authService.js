import { apiClient } from "./apiClient";

export const authService = {
    async login(identifier, password, rememberDevice = true) {
        const deviceId = apiClient.getDeviceId();
        const data = await apiClient.post("/api/auth/login", {
            identifier,
            password,
            rememberDevice,
            deviceId,
        });
        if (data.token) {
            apiClient.setToken(data.token);
        }
        return data;
    },

    async register(username, email, password) {
        return apiClient.post("/api/auth/register", { username, email, password });
    },

    async verifyOtp(email, code) {
        return apiClient.post("/api/auth/verify-otp", { email, code });
    },

    async resendOtp(email) {
        return apiClient.post("/api/auth/resend-otp", { email });
    },

    async forgotPassword(email) {
        return apiClient.post("/api/auth/forgot-password", { email });
    },

    async resetPassword(token, password) {
        return apiClient.post("/api/auth/reset-password", { token, password });
    },

    async me() {
        return apiClient.get("/api/auth/me");
    },

    async getDevices() {
        return apiClient.get("/api/auth/devices");
    },

    async revokeDevice(sessionId) {
        return apiClient.request("DELETE", `/api/auth/devices/${sessionId}`);
    },

    async revokeOtherDevices() {
        return apiClient.post("/api/auth/devices/revoke-others");
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
