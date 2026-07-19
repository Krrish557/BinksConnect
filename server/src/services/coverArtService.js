const sharp = require("sharp");
const metadataService = require("./metadataService");
const { dbGet } = require("../db/dbHelpers");

const MB_RATE_LIMIT_MS = 1200;
let lastMbRequest = 0;

async function rateLimitedFetch(url, options = {}) {
    const now = Date.now();
    const wait = MB_RATE_LIMIT_MS - (now - lastMbRequest);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastMbRequest = Date.now();
    return fetch(url, options);
}

async function searchMusicBrainz(albumName, artistName) {
    const query = [
        albumName && `release:"${albumName}"`,
        artistName && `artist:"${artistName}"`,
    ]
        .filter(Boolean)
        .join(" AND ");

    if (!query) return null;

    const url = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(query)}&fmt=json&limit=5`;
    const res = await rateLimitedFetch(url, {
        headers: { "User-Agent": "BinksConnect/1.0 (contact@binksconnect.com)" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const releaseGroups = data["release-groups"] || [];

    const albumLower = albumName?.toLowerCase() || "";
    const artistLower = artistName?.toLowerCase() || "";

    const best =
        releaseGroups.find(
            (rg) =>
                rg["primary-type"] === "Album" &&
                rg.title?.toLowerCase() === albumLower &&
                (rg["artist-credit"] || []).some((ac) => ac.name?.toLowerCase() === artistLower)
        ) ||
        releaseGroups.find(
            (rg) =>
                rg["primary-type"] === "Album" &&
                rg.title?.toLowerCase() === albumLower
        ) ||
        releaseGroups.find((rg) => rg["primary-type"] === "Album") ||
        releaseGroups[0];

    return best?.id || null;
}

async function fetchCoverFromCAA(mbId) {
    const url = `https://coverartarchive.org/release-group/${mbId}/front-250`;
    const res = await rateLimitedFetch(url, {
        headers: { "User-Agent": "BinksConnect/1.0 (contact@binksconnect.com)" },
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
}

async function processImage(inputBuffer) {
    const fullSize = await sharp(inputBuffer).jpeg({ quality: 90 }).toBuffer();
    const thumbnail = await sharp(inputBuffer).resize(300, 300, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
    return { fullSize, thumbnail };
}

async function fetchAndStoreAlbumCover(albumInternalId) {
    try {
        const album = await dbGet(
            `SELECT a.name as album_name, ar.name as artist_name
             FROM albums a
             LEFT JOIN artists ar ON ar.id = a.artist_id
             WHERE a.internal_id = ?`,
            albumInternalId
        );
        if (!album || !album.album_name) return null;

        const mbId = await searchMusicBrainz(album.album_name, album.artist_name);
        if (!mbId) return null;

        const imageBuffer = await fetchCoverFromCAA(mbId);
        if (!imageBuffer || imageBuffer.length < 100) return null;

        const { fullSize, thumbnail } = await processImage(imageBuffer);
        const albumRow = await dbGet("SELECT id FROM albums WHERE internal_id = ?", albumInternalId);
        if (!albumRow) return null;

        await metadataService.storeAlbumCover(albumRow.id, thumbnail, fullSize, "image/jpeg");
        return { image: fullSize, mimeType: "image/jpeg" };
    } catch (err) {
        console.error(`[CoverArt] Failed to fetch album cover for ${albumInternalId}:`, err.message);
        return null;
    }
}

async function fetchAndStoreArtistCover(artistInternalId) {
    try {
        const artist = await dbGet("SELECT name FROM artists WHERE internal_id = ?", artistInternalId);
        if (!artist || !artist.name) return null;

        const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(`artist:"${artist.name}"`)}&fmt=json&limit=5`;
        const res = await rateLimitedFetch(url, {
            headers: { "User-Agent": "BinksConnect/1.0 (contact@binksconnect.com)" },
        });
        if (!res.ok) return null;

        const data = await res.json();
        const artists = data.artists || [];
        const match = artists.find((a) => a.name?.toLowerCase() === artist.name.toLowerCase()) || artists[0];
        if (!match) return null;

        const mbId = match.id;
        const coverUrl = `https://coverartarchive.org/artist/${mbId}/front-250`;
        const coverRes = await rateLimitedFetch(coverUrl, {
            headers: { "User-Agent": "BinksConnect/1.0 (contact@binksconnect.com)" },
        });
        if (!coverRes.ok) return null;

        const imageBuffer = Buffer.from(await coverRes.arrayBuffer());
        if (imageBuffer.length < 100) return null;

        const { fullSize, thumbnail } = await processImage(imageBuffer);
        const artistRow = await dbGet("SELECT id FROM artists WHERE internal_id = ?", artistInternalId);
        if (!artistRow) return null;

        await metadataService.storeArtistCover(artistRow.id, thumbnail, fullSize, "image/jpeg");
        return { image: fullSize, mimeType: "image/jpeg" };
    } catch (err) {
        console.error(`[CoverArt] Failed to fetch artist cover for ${artistInternalId}:`, err.message);
        return null;
    }
}

module.exports = { fetchAndStoreAlbumCover, fetchAndStoreArtistCover };
