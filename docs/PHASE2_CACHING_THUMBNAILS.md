# Phase 2: Caching Layer + Thumbnails

> Date: 2026-07-15
> Status: Complete
> Scope: Server-side audio cache, HTTP Range requests, cover art extraction, thumbnail generation

---

## Overview

Phase 2 builds on Phase 1's Telegram storage provider by adding:

1. **Server-side audio cache** with LRU eviction (2GB max)
2. **HTTP Range request support** for seeking within audio tracks
3. **Cover art extraction** from embedded ID3/Vorbis metadata
4. **Thumbnail generation** using `sharp` (300x300 + full-size)
5. **Browser caching headers** for streams and cover art

---

## Architecture

### Cache Hierarchy

```
Client (browser HTTP cache)
  ↕ Cache-Control headers
Server (LRU disk cache)
  ↕ audioCache.js
Telegram (permanent storage)
```

**Flow:**
1. First play: Telegram → Server Cache → Client
2. Repeat plays: Server Cache → Client (browser cache hit)
3. Cache miss: Telegram → Server Cache → Client

### Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **AudioCache** | `server/src/cache/audioCache.js` | LRU cache manager, SQLite index, eviction |
| **TelegramProvider** | `server/src/providers/telegram/index.js` | Range-aware download, cache integration |
| **MetadataService** | `server/src/services/metadataService.js` | Cover art storage/retrieval |
| **StreamRoutes** | `server/src/routes/streamRoutes.js` | Range headers, Cache-Control |
| **ArtRoutes** | `server/src/routes/artRoutes.js` | Cover art serving, `?size` param |
| **ChannelScanner** | `server/src/telegram/channelScanner.js` | Artwork extraction from audio files |
| **UploadRoutes** | `server/src/routes/uploadRoutes.js` | Artwork extraction from web uploads |

---

## Audio Cache

### Configuration

| Setting | Default | Env Var | Description |
|---------|---------|---------|-------------|
| **Cache directory** | `server/cache/audio/` | — | Dedicated cache directory |
| **Max size** | 2048 MB (2GB) | `AUDIO_CACHE_MAX_MB` | LRU eviction threshold |

### How It Works

1. **Cache key:** SHA-256 checksum of the audio file
2. **Cache path:** `server/cache/audio/<checksum>.audio`
3. **On hit:** Update access time, serve from disk
4. **On miss:** Download from Telegram, write to cache, evict LRU if over budget
5. **On startup:** Clean stale entries (files deleted by OS cleanup)

### LRU Eviction

When cache exceeds `MAX_CACHE_BYTES`:
1. Query `cache_entries` ordered by `last_accessed ASC`
2. Delete oldest entry (file + DB row)
3. Repeat until under budget

### SQLite Index

```sql
CREATE TABLE cache_entries (
    checksum TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## HTTP Range Requests

### How It Works

The `download()` method now accepts an optional `rangeHeader` parameter:

1. **File fully cached:** Serve range directly from disk using `fs.createReadStream(path, { start, end })`
2. **File not cached:** Download full file from Telegram, store to cache, then serve range from buffer
3. **No range header:** Serve entire file

### Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Accept-Ranges` | `bytes` | Indicates range support |
| `Content-Range` | `bytes 0-1023/4096` | Range info (206 responses only) |
| `Content-Length` | `1024` | Size of the requested chunk |

### Status Codes

- **200 OK:** Full file served (no range or single range)
- **206 Partial Content:** Range request served

---

## Cover Art Extraction

### Extraction Points

Artwork is extracted from embedded metadata at two points:

1. **Channel Scanner** (`channelScanner.js`): When audio files are posted to registered Telegram channels
2. **Upload Routes** (`uploadRoutes.js`): When users upload via the web interface

### Extraction Flow

```
Audio File → music-metadata.parseFile() → common.picture[0]
  → sharp(inputBuffer)
    → .resize(300, 300, { fit: "cover" }).jpeg({ quality: 80 })  → thumbnail
    → .jpeg({ quality: 90 })                                      → full-size
  → Store in album_covers / artist_covers tables
```

### Database Schema

```sql
CREATE TABLE album_covers (
    album_id INTEGER PRIMARY KEY,
    thumbnail BLOB,           -- 300x300 JPEG
    full_size BLOB,           -- Original dimensions JPEG
    mime_type TEXT DEFAULT 'image/jpeg',
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

CREATE TABLE artist_covers (
    artist_id INTEGER PRIMARY KEY,
    thumbnail BLOB,           -- 300x300 JPEG
    full_size BLOB,           -- Original dimensions JPEG
    mime_type TEXT DEFAULT 'image/jpeg',
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);
```

### Metadata Fallback

Priority for track title/artist:
1. Embedded ID3 tags (`common.title`, `common.artist`)
2. Telegram audio metadata (`msg.audio.title`, `msg.audio.performer`)
3. Filename (fallback)

---

## Cover Art API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/art/:albumId` | Album cover art |
| `GET` | `/api/art/artist/:artistId` | Artist cover art |

### Query Parameters

| Param | Values | Default | Description |
|-------|--------|---------|-------------|
| `size` | `thumb`, `full` | `full` | Image size variant |

### Response

- **With art:** `Content-Type: image/jpeg`, body is BLOB data
- **Without art:** `Content-Type: image/svg+xml`, placeholder SVG

### Cache Headers

- Album art: `Cache-Control: public, max-age=86400` (24 hours)
- Placeholder: `Cache-Control: public, max-age=3600` (1 hour)

---

## Browser Caching

### Stream Responses

```
Cache-Control: private, max-age=86400
```

- `private`: User-specific, not shared across users
- `max-age=86400`: Browser caches for 24 hours

### Cover Art Responses

```
Cache-Control: public, max-age=86400
```

- `public`: Can be cached by any cache
- `max-age=86400`: Caches for 24 hours

---

## New Files

| File | Purpose | Lines |
|------|---------|-------|
| `server/src/cache/audioCache.js` | LRU cache manager | 110 |
| `server/cache/audio/` | Cache directory | — |

## Modified Files

| File | Changes |
|------|---------|
| `server/src/db/database.js` | Added `cache_entries`, `album_covers`, `artist_covers` tables |
| `server/src/services/metadataService.js` | Added art storage/retrieval methods |
| `server/src/telegram/channelScanner.js` | Artwork extraction + storage |
| `server/src/routes/uploadRoutes.js` | Artwork extraction + storage |
| `server/src/providers/telegram/index.js` | Cache integration + range support |
| `server/src/routes/streamRoutes.js` | Range headers + Cache-Control |
| `server/src/routes/artRoutes.js` | Real art serving + `?size` param + artist art |
| `server/server.js` | Cache initialization on startup |
| `server/package.json` | Added `sharp` dependency |

---

## Dependencies Added

```json
{
    "sharp": "^0.33.x"
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUDIO_CACHE_MAX_MB` | `2048` | Max audio cache size in MB |

---

## API Changes

### Stream Endpoint

**Before:**
- No range support
- No browser caching headers

**After:**
- Range requests supported (`Accept-Ranges: bytes`)
- `Cache-Control: private, max-age=86400` header
- HTTP 206 for partial content

### Art Endpoint

**Before:**
- Always returned placeholder SVG for Telegram

**After:**
- Returns real cover art from database
- Supports `?size=thumb` (300x300) or `?size=full`
- Falls back to placeholder SVG when no art available
- New endpoint: `GET /api/art/artist/:artistId`

---

## Testing Checklist

### Audio Cache

- [ ] First stream downloads from Telegram and caches
- [ ] Second stream serves from cache (check logs)
- [ ] Cache size stays under 2GB limit
- [ ] LRU eviction removes oldest files when full
- [ ] Stale cache entries cleaned on startup

### Range Requests

- [ ] Seek mid-track works (check 206 responses in network tab)
- [ ] Partial content served correctly
- [ ] Full file served when no range header

### Cover Art

- [ ] MP3 files with embedded art → cover appears in UI
- [ ] FLAC files with embedded art → cover appears in UI
- [ ] Files without art → placeholder SVG shown
- [ ] Thumbnail variant works (`?size=thumb`)
- [ ] Full-size variant works (`?size=full` or no param)
- [ ] Artist art endpoint works

### Browser Caching

- [ ] Stream responses include `Cache-Control` header
- [ ] Art responses include `Cache-Control` header
- [ ] Browser cache shows in Network tab

---

## Migration for Existing Tracks

Existing tracks won't have cover art until re-scanned. To extract art for existing tracks:

1. Remove the existing database: `rm server/src/db/binksconnect.db`
2. Re-register channels and re-upload files
3. Or: Write a migration script to re-process cached audio files

---

## Future Improvements

- **External art fallback:** Try MusicBrainz/Last.fm when no embedded art
- **Configurable cache location:** `.env` variable for `CACHE_DIR`
- **Cache warming:** Pre-fetch popular tracks on startup
- **Art compression:** WebP format for smaller thumbnails
- **Stream encryption:** AES-256-GCM before cache storage
