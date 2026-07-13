export function normalizeAlbums(albums) {
    const seen = new Map();

    for (const album of albums) {
        const key = `${album.name?.toLowerCase().trim()}-${album.artist?.toLowerCase().trim()}`;

        if (!seen.has(key)) {
            seen.set(key, {
                ...album,
                songs: album.songCount || 0,
            });
        } else {
            const existing = seen.get(key);

            seen.set(key, {
                ...existing,
                songs: existing.songs + (album.songCount || 0),
            });
        }
    }

    return Array.from(seen.values());
}