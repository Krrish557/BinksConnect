import { create } from "zustand";
import { authService } from "@/services/authService";
import { apiClient } from "@/services/apiClient";

let _initialized = false;

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isInitializing: true,

    init: async () => {
        if (_initialized) return;
        _initialized = true;
        const existingToken = apiClient.getToken();
        if (!existingToken) {
            set({ isInitializing: false });
            return;
        }
        try {
            const data = await authService.me();
            set({
                user: {
                    username: data.username,
                    email: data.email || null,
                    provider: data.providerId || "telegram",
                },
                isAuthenticated: true,
                isInitializing: false,
            });
        } catch {
            apiClient.setToken(null);
            set({ user: null, isAuthenticated: false, isInitializing: false });
        }
    },

    login: async (identifier, password) => {
        const data = await authService.login(identifier, password);
        set({
            user: {
                username: data.username,
                email: data.email || null,
                provider: data.providerId || "telegram",
            },
            isAuthenticated: true,
        });
        return data;
    },

    logout: async () => {
        await authService.logout();
        if (typeof window !== "undefined") {
            localStorage.removeItem("binks_playlists");
            localStorage.removeItem("binks_player");
        }
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
                user: {
                    username: data.username,
                    email: data.email || null,
                    provider: data.providerId || "telegram",
                },
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
