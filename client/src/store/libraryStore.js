import { create } from "zustand";

const useLibraryStore = create((set) => ({
    albums: [],
    loading: false,
    offset: 0,
    hasMore: true,

    setAlbums: (albums) => set({ albums }),

    appendAlbums: (newAlbums) =>
        set((state) => ({
            albums: [...state.albums, ...newAlbums],
            hasMore: newAlbums.length >= 50,
        })),

    setLoading: (loading) => set({ loading }),

    nextPage: () =>
        set((state) => ({ offset: state.offset + 50 })),

    reset: () => set({ albums: [], offset: 0, hasMore: true }),
}));

export default useLibraryStore;
