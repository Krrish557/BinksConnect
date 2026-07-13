class BaseProvider {
    constructor(config) {
        this.config = config;
    }

    async getAlbums(offset = 0) {
        throw new Error("Not implemented");
    }

    async getAlbumTracks(albumId) {
        throw new Error("Not implemented");
    }

    async getRecentAlbums(size = 12) {
        throw new Error("Not implemented");
    }

    async getNewestAlbums(size = 12) {
        throw new Error("Not implemented");
    }

    async getFrequentAlbums(size = 12) {
        throw new Error("Not implemented");
    }

    async getStarredItems() {
        throw new Error("Not implemented");
    }

    async getSongs(offset = 0) {
        throw new Error("Not implemented");
    }

    async getArtists() {
        throw new Error("Not implemented");
    }

    async getArtist(artistId) {
        throw new Error("Not implemented");
    }

    async search(query) {
        throw new Error("Not implemented");
    }

    async getRandomSongs(size = 20) {
        throw new Error("Not implemented");
    }

    async getStream(trackId, rangeHeader) {
        throw new Error("Not implemented");
    }

    async getCover(albumId) {
        throw new Error("Not implemented");
    }
}

module.exports = BaseProvider;
