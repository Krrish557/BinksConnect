import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/services/apiClient";
import { lyricsService } from "@/services/lyricsService";

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
            lyrics: null,

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
                if (!tracks || tracks.length === 0) return;
                const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
                set({
                    queue: tracks,
                    currentIndex: safeIndex,
                    currentTrack: tracks[safeIndex],
                });

                get().loadTrack();
                get()._addToRecentlyPlayed(tracks[safeIndex]);
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
                } catch (e) {
                    console.warn("Playback failed:", e.message);
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
                if (queue.length === 0) return;

                let nextIndex;
                if (isShuffle) {
                    nextIndex = Math.floor(Math.random() * queue.length);
                } else {
                    if (currentIndex + 1 >= queue.length) {
                        set({ isPlaying: false });
                        return;
                    }
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

            addToQueue: (track) => {
                set((state) => ({
                    queue: [...state.queue, track],
                }));
            },

            playNext: (track) => {
                const { queue, currentIndex, currentTrack } = get();
                if (queue.length === 0) {
                    set({ queue: [track], currentIndex: 0, currentTrack: track });
                    get().loadTrack();
                    get().play();
                    get()._addToRecentlyPlayed(track);
                    return;
                }
                const insertAt = currentIndex + 1;
                const newQueue = [...queue];
                newQueue.splice(insertAt, 0, track);
                set({
                    queue: newQueue,
                    currentIndex: currentIndex + 1,
                    currentTrack: currentTrack || track,
                });
            },

            removeFromQueue: (index) => {
                const { queue, currentIndex } = get();
                if (index < 0 || index >= queue.length) return;
                const newQueue = [...queue];
                newQueue.splice(index, 1);
                if (newQueue.length === 0) {
                    if (audio) { audio.pause(); audio.src = ""; }
                    set({ queue: [], currentIndex: -1, currentTrack: null, isPlaying: false });
                    return;
                }
                let newIndex = currentIndex;
                if (index < currentIndex) {
                    newIndex = currentIndex - 1;
                } else if (index === currentIndex) {
                    newIndex = Math.min(currentIndex, newQueue.length - 1);
                }
                set({
                    queue: newQueue,
                    currentIndex: newIndex,
                    currentTrack: newQueue[newIndex],
                });
                if (newIndex !== currentIndex) {
                    get().loadTrack();
                }
            },

            reorderQueue: (fromIndex, toIndex) => {
                const { queue, currentIndex, currentTrack } = get();
                if (fromIndex === toIndex) return;
                if (fromIndex < 0 || fromIndex >= queue.length) return;
                if (toIndex < 0 || toIndex >= queue.length) return;
                const newQueue = [...queue];
                const [moved] = newQueue.splice(fromIndex, 1);
                newQueue.splice(toIndex, 0, moved);
                let newIndex = currentIndex;
                if (fromIndex === currentIndex) {
                    newIndex = toIndex;
                } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
                    newIndex = currentIndex - 1;
                } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
                    newIndex = currentIndex + 1;
                }
                set({
                    queue: newQueue,
                    currentIndex: newIndex,
                    currentTrack: newQueue[newIndex] || currentTrack,
                });
            },

            fetchLyrics: async (track) => {
                if (!track?.id) return;
                set({ lyrics: null });
                try {
                    const result = await lyricsService.getLyrics(track.id);
                    set({ lyrics: result });
                } catch {
                    set({ lyrics: { synced: false, plain: "", syncedLines: [], notFound: true } });
                }
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
