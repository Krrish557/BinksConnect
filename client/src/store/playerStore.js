import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/services/apiClient";

let audio = null;

export const usePlayerStore = create(
    persist(
        (set, get) => ({
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
            recentlyPlayed: [],

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
                audio.src = apiClient.getStreamUrl(currentTrack.id);
                audio.volume = volume;
                audio.load();

                set({
                    currentTime: 0,
                    duration: 0,
                    isReady: false,
                });

                if (typeof navigator !== "undefined" && navigator.mediaSession) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: currentTrack.title,
                        artist: currentTrack.artist,
                        album: currentTrack.album || "",
                        artwork: currentTrack.cover
                            ? [{ src: apiClient.resolveUrl(currentTrack.cover), sizes: "300x300", type: "image/jpeg" }]
                            : [],
                    });
                }
            },

            play: async () => {
                if (!audio) return;
                try {
                    await audio.play();
                    set({ isPlaying: true });
                } catch (e) {}
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

            seekForward: (seconds = 5) => {
                if (!audio) return;
                const newTime = Math.min(audio.currentTime + seconds, audio.duration || 0);
                audio.currentTime = newTime;
                set({ currentTime: newTime });
            },

            seekBackward: (seconds = 5) => {
                if (!audio) return;
                const newTime = Math.max(audio.currentTime - seconds, 0);
                audio.currentTime = newTime;
                set({ currentTime: newTime });
            },

            setVolume: (vol) => {
                if (audio) audio.volume = vol;
                set({ volume: vol });
            },

            toggleMute: () => {
                const { volume } = get();
                if (volume > 0) {
                    set({ _previousVolume: volume });
                    if (audio) audio.volume = 0;
                    set({ volume: 0 });
                } else {
                    const prev = get()._previousVolume || 1;
                    if (audio) audio.volume = prev;
                    set({ volume: prev });
                }
            },

            toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),

            toggleRepeat: () => set((s) => ({ isRepeat: !s.isRepeat })),

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

            openPlayer: () => set({ isPlayerOpen: true }),
            closePlayer: () => set({ isPlayerOpen: false }),
        }),
        {
            name: "binks_player",
            partialize: (state) => ({
                queue: state.queue,
                currentIndex: state.currentIndex,
                currentTrack: state.currentTrack,
                volume: state.volume,
                isShuffle: state.isShuffle,
                isRepeat: state.isRepeat,
            }),
        }
    )
);
