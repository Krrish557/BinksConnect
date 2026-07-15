import { apiClient } from "./apiClient";

class FavouriteService {
    async toggleFavoriteTrack(trackId) {
        return apiClient.post("/api/favorites/toggle", { trackId });
    }

    async checkFavoriteTracks(trackIds) {
        return apiClient.post("/api/favorites/check", { trackIds });
    }

    async getFavouriteTracks() {
        return apiClient.get("/api/favorites");
    }

    async toggleFavoriteArtist(artistId) {
        return apiClient.post("/api/favorites/artists/toggle", { artistId });
    }

    async checkFavoriteArtists(artistIds) {
        return apiClient.post("/api/favorites/artists/check", { artistIds });
    }

    async getFavouriteArtists() {
        return apiClient.get("/api/favorites/artists");
    }

    async toggleFavoriteAlbum(albumId) {
        return apiClient.post("/api/favorites/albums/toggle", { albumId });
    }

    async checkFavoriteAlbums(albumIds) {
        return apiClient.post("/api/favorites/albums/check", { albumIds });
    }

    async getFavouriteAlbums() {
        return apiClient.get("/api/favorites/albums");
    }
}

export const favouriteService = new FavouriteService();
