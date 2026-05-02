import { create } from "zustand";

let audio = null;

export const usePlayerStore = create((set, get) => ({
    // ================= STATE =================
    currentTrack: null,
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    isReady: false,
    isPlayerOpen: false, // 🔥 NEW

    // ================= AUDIO =================
    initAudio: () => {
        if (audio) return;

        audio = new Audio();

        audio.onloadedmetadata = () => {
            set({ duration: audio.duration, isReady: true });
        };

        audio.ontimeupdate = () => {
            set({ currentTime: audio.currentTime });
        };

        audio.onended = () => {
            get().next();
        };
    },

    // ================= QUEUE =================
    setQueue: (tracks, startIndex = 0) => {
        set({
            queue: tracks,
            currentIndex: startIndex,
            currentTrack: tracks[startIndex] || null,
        });

        get().loadTrack();
    },

    loadTrack: () => {
        const { currentTrack } = get();
        if (!currentTrack) return;

        get().initAudio();

        audio.src = currentTrack.url;
        audio.load();

        set({
            currentTime: 0,
            duration: 0,
            isReady: false,
        });
    },

    // ================= CONTROLS =================
    play: async () => {
        if (!audio) return;
        await audio.play();
        set({ isPlaying: true });
    },

    pause: () => {
        if (!audio) return;
        audio.pause();
        set({ isPlaying: false });
    },

    togglePlay: () => {
        const { isPlaying } = get();
        isPlaying ? get().pause() : get().play();
    },

    next: () => {
        const { currentIndex, queue } = get();

        if (currentIndex + 1 >= queue.length) return;

        const nextIndex = currentIndex + 1;

        set({
            currentIndex: nextIndex,
            currentTrack: queue[nextIndex],
        });

        get().loadTrack();
        get().play();
    },

    previous: () => {
        const { currentIndex, queue } = get();

        if (currentIndex - 1 < 0) return;

        const prevIndex = currentIndex - 1;

        set({
            currentIndex: prevIndex,
            currentTrack: queue[prevIndex],
        });

        get().loadTrack();
        get().play();
    },

    seek: (time) => {
        if (!audio) return;
        audio.currentTime = time;
        set({ currentTime: time });
    },

    // ================= PLAYER UI =================
    openPlayer: () => set({ isPlayerOpen: true }),
    closePlayer: () => set({ isPlayerOpen: false }),
}));