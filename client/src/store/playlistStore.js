import { create } from "zustand";
import { persist } from "zustand/middleware";

let _nextId = Date.now();
const uid = () => String(_nextId++);

const usePlaylistStore = create(
    persist(
        (set, get) => ({
            playlists: [],

            // Create a new empty playlist
            createPlaylist: (name) => {
                const playlist = {
                    id: uid(),
                    name: name || "New Playlist",
                    createdAt: Date.now(),
                    tracks: [],
                };
                set((s) => ({ playlists: [...s.playlists, playlist] }));
                return playlist.id;
            },

            // Delete a playlist
            deletePlaylist: (id) => {
                set((s) => ({
                    playlists: s.playlists.filter((p) => p.id !== id),
                }));
            },

            // Rename a playlist
            renamePlaylist: (id, name) => {
                set((s) => ({
                    playlists: s.playlists.map((p) =>
                        p.id === id ? { ...p, name } : p
                    ),
                }));
            },

            // Add track to playlist (prevent duplicates)
            addTrack: (playlistId, track) => {
                set((s) => ({
                    playlists: s.playlists.map((p) => {
                        if (p.id !== playlistId) return p;
                        const exists = p.tracks.some((t) => t.id === track.id);
                        if (exists) return p;
                        return { ...p, tracks: [...p.tracks, track] };
                    }),
                }));
            },

            // Remove track from playlist
            removeTrack: (playlistId, trackId) => {
                set((s) => ({
                    playlists: s.playlists.map((p) =>
                        p.id === playlistId
                            ? {
                                  ...p,
                                  tracks: p.tracks.filter(
                                      (t) => t.id !== trackId
                                  ),
                              }
                            : p
                    ),
                }));
            },

            // Get single playlist by id
            getPlaylist: (id) => {
                return get().playlists.find((p) => p.id === id) || null;
            },
        }),
        {
            name: "binks_playlists",
        }
    )
);

export default usePlaylistStore;
