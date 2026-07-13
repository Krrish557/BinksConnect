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
    isPlayerOpen: false,
    volume: 1,
    isShuffle: false,
    isRepeat: false,
    recentlyPlayed: [], // array of track objects (max 20)

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
            const { isRepeat } = get();
            if (isRepeat) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
            } else {
                get().next();
            }
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
        get()._addToRecentlyPlayed(tracks[startIndex]);
    },

    loadTrack: () => {
        const { currentTrack, volume } = get();
        if (!currentTrack) return;

        get().initAudio();

        audio.pause();
        audio.src = currentTrack.url;
        audio.volume = volume;
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
        try {
            await audio.play();
            set({ isPlaying: true });
        } catch (e) {
            // AbortError is harmless — a new load() interrupted this play()
        }
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
        const { currentIndex, queue, isShuffle } = get();

        let nextIndex;
        if (isShuffle) {
            nextIndex = Math.floor(Math.random() * queue.length);
        } else {
            if (currentIndex + 1 >= queue.length) return;
            nextIndex = currentIndex + 1;
        }

        set({
            currentIndex: nextIndex,
            currentTrack: queue[nextIndex],
        });

        get().loadTrack();
        get().play();
        get()._addToRecentlyPlayed(queue[nextIndex]);
    },

    previous: () => {
        const { currentIndex, queue, currentTime } = get();

        // If past 3s, restart current track
        if (currentTime > 3) {
            get().seek(0);
            return;
        }

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

    setVolume: (vol) => {
        if (audio) audio.volume = vol;
        set({ volume: vol });
    },

    toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),
    toggleRepeat: () => set((s) => ({ isRepeat: !s.isRepeat })),

    // ================= RECENTLY PLAYED =================
    _addToRecentlyPlayed: (track) => {
        if (!track) return;
        set((state) => {
            const filtered = state.recentlyPlayed.filter(
                (t) => t.id !== track.id
            );
            return {
                recentlyPlayed: [track, ...filtered].slice(0, 20),
            };
        });
    },

    // ================= PLAYER UI =================
    openPlayer: () => set({ isPlayerOpen: true }),
    closePlayer: () => set({ isPlayerOpen: false }),
}));
