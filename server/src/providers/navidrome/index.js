const BaseProvider = require("../base");

function buildSubsonicUrl(serverUrl, endpoint, user, params = {}) {
    const base = new URL(`${serverUrl}/rest/${endpoint}`);
    base.searchParams.set("u", user.username);
    base.searchParams.set("s", user.salt);
    base.searchParams.set("t", user.token);
    base.searchParams.set("v", "1.16.1");
    base.searchParams.set("c", "binksconnect");
    base.searchParams.set("f", "json");
    for (const [k, v] of Object.entries(params)) {
        base.searchParams.set(k, String(v));
    }
    return base.toString();
}

async function fetchSubsonic(url) {
    const res = await fetch(url);
    const data = await res.json();
    const resp = data["subsonic-response"];
    if (resp.status !== "ok") {
        throw new Error(`Subsonic error: ${resp.error?.message || resp.status}`);
    }
    return resp;
}

function makeTrack(raw, config) {
    return {
        id: `navidrome:${raw.id}`,
        title: raw.title,
        artist: raw.artist,
        album: raw.album,
        albumId: `navidrome:${raw.albumId}`,
        duration: raw.duration || 0,
        track: raw.track || 0,
        cover: `/api/art/navidrome:${raw.albumId}`,
        url: `/api/stream/navidrome:${raw.id}`,
        provider: "navidrome",
        sources: [{ provider: "navidrome", sourceId: String(raw.id), streamable: true, cached: false }],
        metadata: {
            genre: raw.genre || undefined,
            year: raw.year || undefined,
            bitrate: raw.bitrate || undefined,
        },
    };
}

function makeAlbum(raw) {
    return {
        id: `navidrome:${raw.id}`,
        name: raw.name || raw.title,
        artist: raw.artist,
        artistId: raw.artistId ? `navidrome:${raw.artistId}` : null,
        coverArt: raw.coverArt,
        songCount: raw.songCount || 0,
        duration: raw.duration || 0,
        year: raw.year || 0,
        coverUrl: `/api/art/navidrome:${raw.id}`,
        provider: "navidrome",
        songs: raw.song ? raw.song.map((s) => makeTrack(s)) : undefined,
    };
}

function makeArtist(raw) {
    const artist = {
        id: `navidrome:${raw.id}`,
        name: raw.name,
        albumCount: raw.albumCount || 0,
        coverArt: raw.coverArt || null,
        provider: "navidrome",
    };
    if (raw.album) {
        artist.album = raw.album.map((a) => ({
            ...makeAlbum(a),
        }));
    }
    return artist;
}

class NavidromeProvider extends BaseProvider {
    get user() {
        return this.config;
    }

    async getAlbums(offset = 0) {
        const url = buildSubsonicUrl(this.user.serverUrl, "getAlbumList2.view", this.user, {
            type: "alphabeticalByName",
            size: 50,
            offset,
        });
        const resp = await fetchSubsonic(url);
        const raw = resp?.albumList2?.album || [];
        return raw.map((a) => makeAlbum(a));
    }

    async getAlbumTracks(albumId) {
        const rawId = albumId.replace("navidrome:", "");
        const url = buildSubsonicUrl(this.user.serverUrl, "getAlbum.view", this.user, { id: rawId });
        const resp = await fetchSubsonic(url);
        const raw = resp?.album;
        if (!raw) return null;
        return {
            album: makeAlbum(raw),
            songs: (raw.song || []).map((s) => makeTrack(s)),
        };
    }

    async getRecentAlbums(size = 12) {
        const url = buildSubsonicUrl(this.user.serverUrl, "getAlbumList2.view", this.user, {
            type: "recent",
            size,
        });
        const resp = await fetchSubsonic(url);
        const raw = resp?.albumList2?.album || [];
        return raw.map((a) => makeAlbum(a));
    }

    async getNewestAlbums(size = 12) {
        const url = buildSubsonicUrl(this.user.serverUrl, "getAlbumList2.view", this.user, {
            type: "newest",
            size,
        });
        const resp = await fetchSubsonic(url);
        const raw = resp?.albumList2?.album || [];
        return raw.map((a) => makeAlbum(a));
    }

    async getFrequentAlbums(size = 12) {
        const url = buildSubsonicUrl(this.user.serverUrl, "getAlbumList2.view", this.user, {
            type: "frequent",
            size,
        });
        const resp = await fetchSubsonic(url);
        const raw = resp?.albumList2?.album || [];
        return raw.map((a) => makeAlbum(a));
    }

    async getStarredItems() {
        const url = buildSubsonicUrl(this.user.serverUrl, "getStarred2.view", this.user);
        const resp = await fetchSubsonic(url);
        return {
            songs: (resp?.starred2?.song || []).map((s) => makeTrack(s)),
            albums: (resp?.starred2?.album || []).map((a) => makeAlbum(a)),
            artists: (resp?.starred2?.artist || []).map((a) => makeArtist(a)),
        };
    }

    async getSongs(offset = 0) {
        const url = buildSubsonicUrl(this.user.serverUrl, "search3.view", this.user, {
            query: "",
            songCount: 50,
            songOffset: offset,
            albumCount: 0,
            artistCount: 0,
        });
        const resp = await fetchSubsonic(url);
        return (resp?.searchResult3?.song || []).map((s) => makeTrack(s));
    }

    async getArtists() {
        const url = buildSubsonicUrl(this.user.serverUrl, "getArtists.view", this.user);
        const resp = await fetchSubsonic(url);
        const indices = resp?.artists?.index || [];
        const rawArtists = indices.flatMap((i) => i.artist || []);
        return rawArtists.map((a) => makeArtist(a));
    }

    async getArtist(artistId) {
        const rawId = artistId.replace("navidrome:", "");
        const url = buildSubsonicUrl(this.user.serverUrl, "getArtist.view", this.user, { id: rawId });
        const resp = await fetchSubsonic(url);
        const raw = resp?.artist;
        if (!raw) return null;
        return makeArtist(raw);
    }

    async search(query) {
        const url = buildSubsonicUrl(this.user.serverUrl, "search3.view", this.user, {
            query,
            songCount: 20,
            albumCount: 10,
            artistCount: 10,
        });
        const resp = await fetchSubsonic(url);
        return {
            songs: (resp?.searchResult3?.song || []).map((s) => makeTrack(s)),
            albums: (resp?.searchResult3?.album || []).map((a) => makeAlbum(a)),
            artists: (resp?.searchResult3?.artist || []).map((a) => makeArtist(a)),
        };
    }

    async getRandomSongs(size = 20) {
        const url = buildSubsonicUrl(this.user.serverUrl, "getRandomSongs.view", this.user, { size });
        const resp = await fetchSubsonic(url);
        return (resp?.randomSongs?.song || []).map((s) => makeTrack(s));
    }

    async getStream(trackId, rangeHeader) {
        const rawId = trackId.replace("navidrome:", "");
        const streamUrl =
            `${this.user.serverUrl}/rest/stream.view` +
            `?id=${rawId}` +
            `&u=${encodeURIComponent(this.user.username)}` +
            `&s=${this.user.salt}` +
            `&t=${this.user.token}` +
            `&v=1.16.1&c=binksconnect`;

        const headers = {};
        if (rangeHeader) {
            headers.Range = rangeHeader;
        }

        const res = await fetch(streamUrl, { headers });
        return {
            stream: res.body,
            status: res.status,
            contentType: res.headers.get("content-type") || "audio/mpeg",
            contentLength: res.headers.get("content-length"),
            contentRange: res.headers.get("content-range"),
        };
    }

    async getCover(albumId) {
        const rawId = albumId.replace("navidrome:", "");
        const artUrl =
            `${this.user.serverUrl}/rest/getCoverArt.view` +
            `?id=${rawId}` +
            `&u=${encodeURIComponent(this.user.username)}` +
            `&s=${this.user.salt}` +
            `&t=${this.user.token}` +
            `&v=1.16.1&c=binksconnect`;

        const res = await fetch(artUrl);
        return {
            stream: res.body,
            contentType: res.headers.get("content-type") || "image/jpeg",
        };
    }
}

module.exports = NavidromeProvider;
