import { create } from "zustand";

const usePlayerStore = create((set) => ({
    currentSong: null,
    isPlaying: false,
    queue: [],

    playSong: (song) =>
        set({
            currentSong: song,
            isPlaying: true
        }),

    pauseSong: () =>
        set({
            isPlaying: false
        }),

    addToQueue: (song) =>
        set((state) => ({
            queue: [...state.queue, song]
        }))
}));

export default usePlayerStore;