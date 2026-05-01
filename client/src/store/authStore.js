import { create } from "zustand";

const getInitialUser = () => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem("binks_user");
    return stored ? JSON.parse(stored) : null;
};

const useAuthStore = create((set) => ({
    user: getInitialUser(),
    isAuthenticated: !!getInitialUser(),

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