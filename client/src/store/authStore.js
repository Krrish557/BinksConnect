import { create } from "zustand";
import { authService } from "@/services/authService";
import { apiClient } from "@/services/apiClient";

const token = authService.loadSession();
let _initialized = false;

const useAuthStore = create((set) => ({
    user: token ? { provider: "navidrome" } : null,
    isAuthenticated: !!token,
    isInitializing: !token,

    init: async () => {
        if (_initialized) return;
        _initialized = true;
        const existingToken = apiClient.getToken();
        if (existingToken) {
            set({ isInitializing: false });
            return;
        }
        const data = await authService.autoTelegramLogin();
        if (data) {
            set({
                user: { provider: data.providerId || "telegram" },
                isAuthenticated: true,
                isInitializing: false,
            });
        } else {
            set({ isInitializing: false });
        }
    },

    login: async (serverUrl, username, password, providerId = "navidrome") => {
        const data = await authService.login(serverUrl, username, password, providerId);
        set({
            user: { provider: data.providerId || providerId },
            isAuthenticated: true,
        });
        return data;
    },

    logout: async () => {
        await authService.logout();
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        try {
            const token = apiClient.getToken();
            if (!token) {
                set({ user: null, isAuthenticated: false });
                return false;
            }
            const data = await authService.me();
            set({
                user: { provider: data.providerId, username: data.username },
                isAuthenticated: true,
            });
            return true;
        } catch {
            set({ user: null, isAuthenticated: false });
            return false;
        }
    },
}));

export default useAuthStore;
