import { create } from "zustand";
import { authService } from "@/services/authService";
import { apiClient } from "@/services/apiClient";

let _initialized = false;

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isInitializing: true,
    devices: [],
    loadingDevices: false,

    init: async () => {
        if (_initialized) return;
        _initialized = true;
        const existingToken = apiClient.loadToken() || apiClient.getToken();
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
                    provider: data.providerId || "cloud",
                    currentDevice: data.currentDevice || null,
                },
                isAuthenticated: true,
                isInitializing: false,
            });
        } catch {
            apiClient.setToken(null);
            set({ user: null, isAuthenticated: false, isInitializing: false });
        }
    },

    login: async (identifier, password, rememberDevice = true) => {
        const data = await authService.login(identifier, password, rememberDevice);
        set({
            user: {
                username: data.username,
                email: data.email || null,
                provider: data.providerId || "cloud",
                currentDevice: {
                    deviceId: data.deviceId,
                    deviceName: data.deviceName,
                    rememberDevice: data.rememberDevice,
                },
            },
            isAuthenticated: true,
        });
        return data;
    },

    fetchDevices: async () => {
        set({ loadingDevices: true });
        try {
            const res = await authService.getDevices();
            set({ devices: res.devices || [], loadingDevices: false });
        } catch (err) {
            console.error("Fetch devices error:", err);
            set({ loadingDevices: false });
        }
    },

    revokeDevice: async (sessionId) => {
        try {
            await authService.revokeDevice(sessionId);
            set((state) => ({
                devices: state.devices.filter((d) => d.sessionId !== sessionId),
            }));
        } catch (err) {
            console.error("Revoke device error:", err);
        }
    },

    revokeOtherDevices: async () => {
        try {
            await authService.revokeOtherDevices();
            set((state) => ({
                devices: state.devices.filter((d) => d.isCurrent),
            }));
        } catch (err) {
            console.error("Revoke other devices error:", err);
        }
    },

    logout: async () => {
        await authService.logout();
        if (typeof window !== "undefined") {
            localStorage.removeItem("binks_playlists");
            localStorage.removeItem("binks_player");
        }
        set({ user: null, isAuthenticated: false, devices: [] });
    },

    checkAuth: async () => {
        try {
            const token = apiClient.loadToken() || apiClient.getToken();
            if (!token) {
                set({ user: null, isAuthenticated: false });
                return false;
            }
            const data = await authService.me();
            set({
                user: {
                    username: data.username,
                    email: data.email || null,
                    provider: data.providerId || "cloud",
                    currentDevice: data.currentDevice || null,
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
