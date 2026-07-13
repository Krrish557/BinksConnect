import { create } from "zustand";
import { authService } from "@/services/authService";
import { apiClient } from "@/services/apiClient";

const token = authService.loadSession();

const useAuthStore = create((set) => ({
    user: token ? { provider: "navidrome" } : null,
    isAuthenticated: !!token,

    login: async (serverUrl, username, password) => {
        const data = await authService.login(serverUrl, username, password);
        set({
            user: { provider: data.providerId || "navidrome" },
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
