export function makeCompositeId(provider, localId) {
    return `${provider}:${localId}`;
}

export function parseCompositeId(compositeId) {
    const idx = compositeId.indexOf(':');
    if (idx === -1) {
        throw new Error(`Invalid composite ID — missing provider prefix: ${compositeId}`);
    }
    return {
        provider: compositeId.substring(0, idx),
        localId: compositeId.substring(idx + 1),
    };
}

export function createTrackSource(provider, sourceId, opts = {}) {
    return {
        provider,
        sourceId,
        quality: opts.quality || null,
        streamable: opts.streamable !== false,
        cached: opts.cached || false,
    };
}

export function createTrack(data) {
    return {
        id: data.id,
        title: data.title,
        artist: data.artist,
        album: data.album,
        albumId: data.albumId,
        duration: data.duration || 0,
        track: data.track || 0,
        cover: data.cover || null,
        url: data.url || null,
        provider: data.provider,
        sources: data.sources || [],
        artwork: data.artwork || data.cover || null,
        metadata: {
            genre: data.genre || undefined,
            year: data.year || undefined,
            bitrate: data.bitrate || undefined,
        },
    };
}

export function createAlbum(data) {
    return {
        id: data.id,
        name: data.name,
        artist: data.artist,
        artistId: data.artistId,
        coverArt: data.coverArt,
        songCount: data.songCount || 0,
        duration: data.duration || 0,
        year: data.year || 0,
        coverUrl: data.coverUrl || null,
        provider: data.provider,
        songs: data.songs || undefined,
    };
}

export function createArtist(data) {
    return {
        id: data.id,
        name: data.name,
        albumCount: data.albumCount || 0,
        coverArt: data.coverArt || null,
        provider: data.provider,
    };
}

export function createPlaylist(data) {
    return {
        id: data.id,
        name: data.name,
        owner: data.owner || null,
        songCount: data.songCount || 0,
        duration: data.duration || 0,
        public: data.public || false,
        provider: data.provider,
        tracks: data.tracks || [],
    };
}
