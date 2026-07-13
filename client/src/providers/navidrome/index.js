import {
    createTrack,
    createAlbum,
    createArtist,
    createPlaylist,
    createTrackSource,
    makeCompositeId,
} from '@/core/models';
import { registerProvider } from '@/providers/registry';

function buildUrl(user, endpoint, params = {}) {
    const base = new URL(`${user.serverUrl}/rest/${endpoint}`);
    base.searchParams.set('u', user.username);
    base.searchParams.set('s', user.salt);
    base.searchParams.set('t', user.token);
    base.searchParams.set('v', '1.16.1');
    base.searchParams.set('c', 'binksconnect');
    base.searchParams.set('f', 'json');
    for (const [k, v] of Object.entries(params)) {
        base.searchParams.set(k, v);
    }
    return base.toString();
}

async function fetchJson(url) {
    const res = await fetch(url);
    const data = await res.json();
    return data['subsonic-response'];
}

class NavidromeProvider {
    static id = 'navidrome';
    static displayName = 'Navidrome';
    static description = 'Connect to your Navidrome server';
    static icon = '🎵';
    static enabled = true;

    static getConfigSchema() {
        return [
            {
                key: 'serverUrl',
                label: 'Server URL',
                type: 'text',
                placeholder: 'https://music.example.com',
                required: true,
            },
            {
                key: 'username',
                label: 'Username',
                type: 'text',
                placeholder: 'admin',
                required: true,
            },
            {
                key: 'password',
                label: 'Password',
                type: 'password',
                placeholder: '••••••••',
                required: true,
            },
        ];
    }

    static async validateConfig(config) {
        const res = await fetch('http://192.168.1.11:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serverUrl: config.serverUrl,
                username: config.username,
                password: config.password,
            }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'Invalid credentials');
        }
        return {
            serverUrl: data.serverUrl,
            username: data.username,
            salt: data.salt,
            token: data.token,
        };
    }

    constructor(userConfig) {
        this.user = userConfig;
        this.id = 'navidrome';
        this._providerId = 'navidrome';
    }

    getTrackUrl(trackId) {
        return (
            `${this.user.serverUrl}/rest/stream.view` +
            `?id=${trackId}` +
            `&u=${encodeURIComponent(this.user.username)}` +
            `&s=${this.user.salt}` +
            `&t=${this.user.token}` +
            `&v=1.16.1&c=binksconnect`
        );
    }

    getCoverUrl(albumId) {
        return `${this.user.serverUrl}/rest/getCoverArt.view?id=${albumId}&u=${encodeURIComponent(this.user.username)}&s=${this.user.salt}&t=${this.user.token}&v=1.16.1&c=binksconnect`;
    }

    makeTrack(raw) {
        const pid = this._providerId;
        return createTrack({
            id: makeCompositeId(pid, raw.id),
            title: raw.title,
            artist: raw.artist,
            album: raw.album,
            albumId: raw.albumId,
            duration: raw.duration || 0,
            track: raw.track || 0,
            cover: this.getCoverUrl(raw.albumId),
            url: this.getTrackUrl(raw.id),
            albumArtists: raw.albumArtists,
            provider: pid,
            sources: [createTrackSource(pid, raw.id)],
            genre: raw.genre,
            year: raw.year,
            bitrate: raw.bitrate,
        });
    }

    makeAlbum(raw, coverUrl) {
        const pid = this._providerId;
        return createAlbum({
            id: makeCompositeId(pid, raw.id),
            name: raw.name || raw.title,
            artist: raw.artist,
            artistId: raw.artistId,
            coverArt: raw.coverArt,
            songCount: raw.songCount || 0,
            duration: raw.duration || 0,
            year: raw.year || 0,
            coverUrl: coverUrl || this.getCoverUrl(raw.id),
            provider: pid,
            songs: raw.song
                ? raw.song.map((s) => this.makeTrack(s))
                : undefined,
        });
    }

    makeArtist(raw) {
        const pid = this._providerId;
        const artist = createArtist({
            id: makeCompositeId(pid, raw.id),
            name: raw.name,
            albumCount: raw.albumCount || 0,
            coverArt: raw.coverArt || null,
            provider: pid,
        });
        if (raw.album) {
            artist.album = raw.album.map((a) => ({
                ...a,
                id: makeCompositeId(pid, a.id),
            }));
        }
        return artist;
    }

    async getAlbums(offset = 0) {
        const url = buildUrl(this.user, 'getAlbumList2.view', {
            type: 'alphabeticalByName',
            size: 50,
            offset,
        });
        const resp = await fetchJson(url);
        const raw = resp?.albumList2?.album || [];
        return raw.map((a) => this.makeAlbum(a));
    }

    async getAlbumTracks(albumId) {
        const url = buildUrl(this.user, 'getAlbum.view', { id: albumId });
        const resp = await fetchJson(url);
        const raw = resp?.album;
        if (!raw) return null;
        return {
            album: this.makeAlbum(raw),
            songs: (raw.song || []).map((s) => this.makeTrack(s)),
        };
    }

    async getRecentAlbums(size = 12) {
        const url = buildUrl(this.user, 'getAlbumList2.view', {
            type: 'recent',
            size,
        });
        const resp = await fetchJson(url);
        const raw = resp?.albumList2?.album || [];
        return raw.map((a) => this.makeAlbum(a));
    }

    async getNewestAlbums(size = 12) {
        const url = buildUrl(this.user, 'getAlbumList2.view', {
            type: 'newest',
            size,
        });
        const resp = await fetchJson(url);
        const raw = resp?.albumList2?.album || [];
        return raw.map((a) => this.makeAlbum(a));
    }

    async getFrequentAlbums(size = 12) {
        const url = buildUrl(this.user, 'getAlbumList2.view', {
            type: 'frequent',
            size,
        });
        const resp = await fetchJson(url);
        const raw = resp?.albumList2?.album || [];
        return raw.map((a) => this.makeAlbum(a));
    }

    async getStarredItems() {
        const url = buildUrl(this.user, 'getStarred2.view');
        const resp = await fetchJson(url);
        return {
            songs: (resp?.starred2?.song || []).map((s) => this.makeTrack(s)),
            albums: (resp?.starred2?.album || []).map((a) => this.makeAlbum(a)),
            artists: (resp?.starred2?.artist || []).map((a) => this.makeArtist(a)),
        };
    }

    async getSongs(offset = 0) {
        const url = buildUrl(this.user, 'search3.view', {
            query: '',
            songCount: 50,
            songOffset: offset,
            albumCount: 0,
            artistCount: 0,
        });
        const resp = await fetchJson(url);
        return (resp?.searchResult3?.song || []).map((s) => this.makeTrack(s));
    }

    async getArtists() {
        const url = buildUrl(this.user, 'getArtists.view');
        const resp = await fetchJson(url);
        const indices = resp?.artists?.index || [];
        const rawArtists = indices.flatMap((i) => i.artist || []);
        return rawArtists.map((a) => this.makeArtist(a));
    }

    async getArtist(artistId) {
        const url = buildUrl(this.user, 'getArtist.view', { id: artistId });
        const resp = await fetchJson(url);
        const raw = resp?.artist;
        if (!raw) return null;
        return this.makeArtist(raw);
    }

    async search(query) {
        const url = buildUrl(this.user, 'search3.view', {
            query,
            songCount: 20,
            albumCount: 10,
            artistCount: 10,
        });
        const resp = await fetchJson(url);
        return {
            songs: (resp?.searchResult3?.song || []).map((s) => this.makeTrack(s)),
            albums: (resp?.searchResult3?.album || []).map((a) => this.makeAlbum(a)),
            artists: (resp?.searchResult3?.artist || []).map((a) => this.makeArtist(a)),
        };
    }

    async getRandomSongs(size = 20) {
        const url = buildUrl(this.user, 'getRandomSongs.view', { size });
        const resp = await fetchJson(url);
        return (resp?.randomSongs?.song || []).map((s) => this.makeTrack(s));
    }
}

registerProvider('navidrome', NavidromeProvider);

export default NavidromeProvider;
