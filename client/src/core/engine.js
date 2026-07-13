import { parseCompositeId } from '@/core/models';

class MusicEngine {
    constructor() {
        this.provider = null;
        this.providerId = null;
    }

    setProvider(provider) {
        this.provider = provider;
        this.providerId = provider ? provider.id : null;
    }

    reset() {
        this.provider = null;
        this.providerId = null;
    }

    _ensure() {
        if (!this.provider) {
            throw new Error('MusicEngine not initialized. Log in first.');
        }
    }

    _rawId(compositeId) {
        return parseCompositeId(compositeId).localId;
    }

    async getAlbums(offset = 0) {
        this._ensure();
        return this.provider.getAlbums(offset);
    }

    async getAlbumTracks(albumId) {
        this._ensure();
        return this.provider.getAlbumTracks(this._rawId(albumId));
    }

    async getRecentAlbums(size = 12) {
        this._ensure();
        return this.provider.getRecentAlbums(size);
    }

    async getNewestAlbums(size = 12) {
        this._ensure();
        return this.provider.getNewestAlbums(size);
    }

    async getFrequentAlbums(size = 12) {
        this._ensure();
        return this.provider.getFrequentAlbums(size);
    }

    async getStarredItems() {
        this._ensure();
        return this.provider.getStarredItems();
    }

    async getSongs(offset = 0) {
        this._ensure();
        return this.provider.getSongs(offset);
    }

    async getArtists() {
        this._ensure();
        return this.provider.getArtists();
    }

    async getArtist(artistId) {
        this._ensure();
        return this.provider.getArtist(this._rawId(artistId));
    }

    async search(query) {
        this._ensure();
        return this.provider.search(query);
    }

    async getRandomSongs(size = 20) {
        this._ensure();
        return this.provider.getRandomSongs(size);
    }

    getStreamUrl(track) {
        return track.url;
    }

    getArtworkUrl(albumId) {
        this._ensure();
        return this.provider.getCoverUrl(this._rawId(albumId));
    }
}

export const musicEngine = new MusicEngine();
