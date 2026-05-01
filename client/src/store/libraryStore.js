import { create } from "zustand";

const useLibraryStore = create((set) => ({
    albums: [],
    loading: false,
    offset: 0,

    setAlbums: (albums) =>
        set({ albums }),

    appendAlbums: (newAlbums) =>
        set((state) => ({
            albums: [
                ...state.albums,
                ...newAlbums
            ]
        })),

    setLoading: (loading) =>
        set({ loading }),

    nextPage: () =>
        set((state) => ({
            offset: state.offset + 50
        }))
}));

export default useLibraryStore;