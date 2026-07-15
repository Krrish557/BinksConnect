import { create } from "zustand";
import { persist } from "zustand/middleware";
import { playlistService } from "@/services/playlistService";

const usePlaylistStore = create(
    persist(
        (set, get) => ({
            playlists: [],
            _migrated: false,
            _loaded: false,

            loadPlaylists: async () => {
                if (get()._loaded) return;
                try {
                    const serverPlaylists = await playlistService.getPlaylists();

                    if (serverPlaylists.length === 0 && get().playlists.length > 0 && !get()._migrated) {
                        await get()._migrateToServer();
                        set({ _loaded: true, _migrated: true });
                        return;
                    }

                    const detailed = await Promise.all(
                        serverPlaylists.map(async (p) => {
                            try {
                                const full = await playlistService.getPlaylist(p.id);
                                return { ...p, tracks: full.tracks || [] };
                            } catch {
                                return { ...p, tracks: [] };
                            }
                        })
                    );
                    set({ playlists: detailed, _loaded: true });
                } catch (err) {
                    console.error("Failed to load playlists:", err);
                    set({ _loaded: true });
                }
            },

            _migrateToServer: async () => {
                const localPlaylists = get().playlists;
                for (const lp of localPlaylists) {
                    try {
                        const created = await playlistService.createPlaylist(lp.name);
                        for (const track of lp.tracks) {
                            await playlistService.addTrack(created.id, track.id);
                        }
                    } catch (err) {
                        console.error("Migration error for playlist:", lp.name, err);
                    }
                }
                try {
                    const serverPlaylists = await playlistService.getPlaylists();
                    const detailed = await Promise.all(
                        serverPlaylists.map(async (p) => {
                            try {
                                const full = await playlistService.getPlaylist(p.id);
                                return { ...p, tracks: full.tracks || [] };
                            } catch {
                                return { ...p, tracks: [] };
                            }
                        })
                    );
                    set({ playlists: detailed });
                } catch (err) {
                    console.error("Failed to reload after migration:", err);
                }
            },

            createPlaylist: async (name) => {
                try {
                    const created = await playlistService.createPlaylist(name);
                    const newPlaylist = { ...created, tracks: [] };
                    set((s) => ({ playlists: [newPlaylist, ...s.playlists] }));
                    return created.id;
                } catch (err) {
                    console.error("Create playlist error:", err);
                    return null;
                }
            },

            deletePlaylist: async (id) => {
                try {
                    await playlistService.deletePlaylist(id);
                    set((s) => ({
                        playlists: s.playlists.filter((p) => p.id !== id),
                    }));
                } catch (err) {
                    console.error("Delete playlist error:", err);
                }
            },

            renamePlaylist: async (id, name) => {
                try {
                    await playlistService.renamePlaylist(id, name);
                    set((s) => ({
                        playlists: s.playlists.map((p) =>
                            p.id === id ? { ...p, name } : p
                        ),
                    }));
                } catch (err) {
                    console.error("Rename playlist error:", err);
                }
            },

            addTrack: async (playlistId, track) => {
                try {
                    await playlistService.addTrack(playlistId, track.id);
                    set((s) => ({
                        playlists: s.playlists.map((p) => {
                            if (p.id !== playlistId) return p;
                            const exists = p.tracks.some((t) => t.id === track.id);
                            if (exists) return p;
                            return { ...p, tracks: [...p.tracks, track] };
                        }),
                    }));
                } catch (err) {
                    console.error("Add track error:", err);
                }
            },

            removeTrack: async (playlistId, trackId) => {
                try {
                    await playlistService.removeTrack(playlistId, trackId);
                    set((s) => ({
                        playlists: s.playlists.map((p) =>
                            p.id === playlistId
                                ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
                                : p
                        ),
                    }));
                } catch (err) {
                    console.error("Remove track error:", err);
                }
            },

            reorderTracks: async (playlistId, trackIds) => {
                try {
                    await playlistService.reorderTracks(playlistId, trackIds);
                    set((s) => ({
                        playlists: s.playlists.map((p) => {
                            if (p.id !== playlistId) return p;
                            const trackMap = new Map(p.tracks.map((t) => [t.id, t]));
                            const reordered = trackIds.map((id) => trackMap.get(id)).filter(Boolean);
                            return { ...p, tracks: reordered };
                        }),
                    }));
                } catch (err) {
                    console.error("Reorder tracks error:", err);
                }
            },

            getPlaylist: (id) => {
                return get().playlists.find((p) => p.id === id) || null;
            },
        }),
        {
            name: "binks_playlists",
            partialize: (state) => ({
                playlists: state.playlists,
                _migrated: state._migrated,
            }),
        }
    )
);

export default usePlaylistStore;
