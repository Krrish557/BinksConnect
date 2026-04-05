import { create } from "zustand";

const useAuthStore = create((set) => ({
    user:
        typeof window !== "undefined"
            ? JSON.parse(
                localStorage.getItem("binks_user")
            ) || null
            : null,

    isAuthenticated:
        typeof window !== "undefined"
            ? !!localStorage.getItem("binks_user")
            : false,

    login: (user) => {
        localStorage.setItem(
            "binks_user",
            JSON.stringify(user)
        );

        set({
            user,
            isAuthenticated: true
        });
    },

    logout: () => {
        localStorage.removeItem("binks_user");

        set({
            user: null,
            isAuthenticated: false
        });
    }
}));

export default useAuthStore;