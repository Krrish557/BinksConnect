import { create } from "zustand";
import { providerManager } from "@/core/providerManager";
import "@/providers";

const initialSession = providerManager.load();
const initialUser = initialSession
    ? { ...initialSession.config, provider: initialSession.providerId }
    : null;

if (initialSession) {
    providerManager.initializeFromSession();
}

const useAuthStore = create((set) => {
    if (typeof window !== "undefined") {
        providerManager.onChange((session) => {
            set({
                user: session
                    ? { ...session.config, provider: session.providerId }
                    : null,
                isAuthenticated: !!session?.authenticated,
            });
        });
    }

    return {
        user: initialUser,
        isAuthenticated: !!initialUser,

        login: async (providerId, config) => {
            await providerManager.completeOnboarding(providerId, config);
        },

        logout: () => {
            providerManager.logout();
        },
    };
});

export default useAuthStore;
