# Phase 1: Telegram Provider Integration

> Date: 2026-07-14
> Status: Complete
> Scope: Core Telegram storage provider, metadata DB, upload pipeline, streaming, internal track IDs

---

## Overview

Phase 1 implements Telegram as a **binary object storage backend** within the BinksConnect provider-agnostic architecture. Telegram is NOT a music provider — it only stores files. All metadata (tracks, albums, artists, search, favorites, history) lives in SQLite. The client never knows Telegram exists.

### What Changed Architecturally

Before Phase 1, BinksConnect only supported Navidrome as a full provider (metadata + streaming). After Phase 1:

```
Client
  → ApiClient + Service Layer
    → Express Backend
      → Metadata Layer (SQLite via MetadataService)
        → Provider Manager (via Provider Registry)
          → Storage Providers
            → TelegramProvider  (binary only)
            → NavidromeProvider (full, unchanged)
```

**Key principle:** Storage providers move bytes. Metadata services query SQLite. The frontend only understands BinksConnect internal IDs.

---

## Architecture

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **MetadataService** | All metadata queries — albums, artists, tracks, search, favorites, play history, random songs |
| **ProviderManager** | Routes sessions to the correct storage provider |
| **ProviderRegistry** | Dynamic provider registration — no hardcoded provider creation |
| **TelegramProvider** | Storage operations only — upload, download, delete, exists, health, verify |
| **NavidromeProvider** | Full provider — handles everything (unchanged from Phase 0) |
| **Telegram Bot Service** | Grammy wrapper — low-level Telegram Bot API calls |
| **ChannelAllocator** | Selects which Telegram channel to upload to — pluggable strategies |
| **File Scanner** | Validates uploads — MIME type, size, magic bytes |

### Data Flow

**Upload:**
```
File → Scanner → ID3 Extraction → SHA-256 Checksum → Duplicate Check
  → Generate Internal IDs → Allocate Channel → Telegram Upload
  → Store Metadata (tracks, artists, albums) → Store Provider Mapping
```

**Playback:**
```
Client → GET /api/stream/{internalTrackId} → JWT Verification
  → Metadata Lookup → Provider Mapping Lookup → Provider Resolution
  → TelegramProvider.download() → Cache Check → Telegram Download
  → HTTP Stream to Client
```

---

## Internal ID System

Every entity has a permanent, provider-agnostic identifier:

| Prefix | Entity | Example |
|--------|--------|---------|
| `trk_` | Track | `trk_m1abc123def456` |
| `alb_` | Album | `alb_m1abc123def456` |
| `art_` | Artist | `art_m1abc123def456` |

**Implementation:** `server/src/db/ids.js`

```js
function generateId(prefix) {
    const timestamp = Date.now().toString(36);  // base36 timestamp
    const random = crypto.randomBytes(4).toString("hex");  // 8 hex chars
    return `${prefix}_${timestamp}${random}`;
}
```

- Time-sortable (base36 timestamp prefix)
- Unique (cryptographic random suffix)
- Permanent (never changes, even if file moves providers)
- Never exposed to the client as provider-specific IDs

---

## Database Schema

### Tables

```sql
-- Users (unchanged)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions (unchanged)
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider_id TEXT NOT NULL,          -- "navidrome" or "telegram"
    provider_config TEXT NOT NULL,      -- JSON config
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Artists (provider-agnostic)
CREATE TABLE artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internal_id TEXT UNIQUE NOT NULL,   -- art_xxxxxxxx
    name TEXT NOT NULL,
    cover_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Albums (provider-agnostic)
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internal_id TEXT UNIQUE NOT NULL,   -- alb_xxxxxxxx
    name TEXT NOT NULL,
    artist_id INTEGER,
    year INTEGER DEFAULT 0,
    cover_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL
);

-- Tracks (provider-agnostic — NO provider column)
CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internal_id TEXT UNIQUE NOT NULL,   -- trk_xxxxxxxx
    title TEXT NOT NULL,
    artist_id INTEGER,
    album_id INTEGER,
    duration REAL DEFAULT 0,
    genre TEXT,
    year INTEGER,
    track_number INTEGER,
    bitrate INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE SET NULL,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
);

-- Provider Mappings (bridge between tracks and storage)
CREATE TABLE provider_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    provider TEXT NOT NULL,             -- "telegram" or "navidrome"
    provider_track_id TEXT,
    telegram_channel_id TEXT,
    telegram_message_id INTEGER,
    telegram_file_id TEXT,
    telegram_file_unique_id TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    checksum TEXT,                      -- SHA-256
    uploaded_by TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- Telegram Channels
CREATE TABLE telegram_channels (
    channel_id TEXT PRIMARY KEY,
    title TEXT,
    is_active INTEGER DEFAULT 1,
    strategy TEXT DEFAULT 'round_robin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Favorites (per user)
CREATE TABLE favorites (
    user_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- Play History
CREATE TABLE play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);
```

### Indexes

```sql
CREATE INDEX idx_tracks_artist ON tracks(artist_id);
CREATE INDEX idx_tracks_album ON tracks(album_id);
CREATE INDEX idx_provider_mappings_track ON provider_mappings(track_id);
CREATE INDEX idx_provider_mappings_checksum ON provider_mappings(checksum);
CREATE INDEX idx_play_history_user ON play_history(user_id);
CREATE INDEX idx_play_history_track ON play_history(track_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
```

### Design Decisions

1. **No provider column in tracks** — Tracks are business entities. `provider_mappings` links them to storage. A track can exist in multiple providers simultaneously.
2. **Normalized artists/albums** — Prevents duplication. Search, filtering, and artwork are cleaner.
3. **Checksum-based duplicate detection** — SHA-256 before upload prevents duplicate files.
4. **SQLite indexes** — Optimized for common query patterns (album tracks, user favorites, search).

---

## New Files

### Server Side (10 new files)

| File | Purpose | Lines |
|------|---------|-------|
| `server/src/db/ids.js` | Internal ID generator (trk_, alb_, art_ prefixes) | 16 |
| `server/src/services/metadataService.js` | SQLite metadata layer — CRUD, search, favorites, history | 350+ |
| `server/src/telegram/bot.js` | Grammy Bot wrapper — upload, download, delete, health | 95 |
| `server/src/telegram/scanner.js` | File validation — MIME, extension, size, magic bytes | 65 |
| `server/src/providers/telegram/index.js` | Storage-only provider — upload/download/delete/exists/health/verify | 130 |
| `server/src/providers/registry.js` | Provider Registry — dynamic registration | 25 |
| `server/src/providers/channelAllocator.js` | Channel allocation — RoundRobin, LeastUsed, Random | 75 |
| `server/src/routes/uploadRoutes.js` | Upload pipeline with multer, ID3 extraction, full pipeline | 150 |
| `server/src/routes/favoriteRoutes.js` | Favorites toggle + list | 40 |
| `server/src/routes/adminRoutes.js` | Channel management — add/remove/list | 50 |
| `server/.env.example` | Environment variable template | 8 |

### Client Side (1 new file)

| File | Purpose | Lines |
|------|---------|-------|
| `client/src/app/upload/page.js` | Drag-and-drop upload UI with metadata preview | 185 |

---

## Modified Files

### Server Side (10 modified files)

| File | Changes |
|------|---------|
| `server/src/db/database.js` | Added 7 new tables (tracks, artists, albums, provider_mappings, telegram_channels, favorites, play_history) + 7 indexes |
| `server/src/providers/manager.js` | Refactored to use ProviderRegistry instead of hardcoded switch |
| `server/src/routes/authRoutes.js` | Added Telegram login handler + updated /me for Telegram sessions |
| `server/src/routes/albumRoutes.js` | Routes to MetadataService for Telegram, NavidromeProvider for Navidrome |
| `server/src/routes/artistRoutes.js` | Routes to MetadataService for Telegram sessions |
| `server/src/routes/trackRoutes.js` | Routes to MetadataService for Telegram sessions |
| `server/src/routes/searchRoutes.js` | Routes to MetadataService for Telegram sessions |
| `server/src/routes/streamRoutes.js` | Telegram: download via TelegramStorageProvider + record play history |
| `server/src/routes/artRoutes.js` | Telegram: returns SVG placeholder (no embedded art yet) |
| `server/server.js` | Wired upload, favorites, admin routes |
| `server/package.json` | Added grammy, music-metadata, mime-types, multer |

### Client Side (6 modified files)

| File | Changes |
|------|---------|
| `client/src/app/onboarding/page.js` | Telegram moved from COMING_SOON to enabled PROVIDERS (no fields needed — server-level config) |
| `client/src/services/authService.js` | Added provider ID parameter to login() for Telegram support |
| `client/src/store/authStore.js` | Updated login() signature to accept provider ID |
| `client/src/app/settings/page.js` | Added library stats display for Telegram provider |
| `client/src/components/Sidebar.js` | Added Upload nav link (Telegram-only) |
| `client/src/components/MobileNav.js` | Added Upload nav link (Telegram-only) |

---

## Provider System

### Provider Registry

```js
// server/src/providers/registry.js
class ProviderRegistry {
    register(id, factory)    // Register a provider factory
    create(id, config)       // Create provider instance
    has(id)                  // Check if provider exists
    list()                   // List all registered providers
}
```

Adding a new provider requires only:
1. Create the provider class
2. Register it: `registry.register("s3", (config) => new S3Provider(config))`

Core manager code remains unchanged.

### Provider Manager

Refactored to use the registry:

```js
const registry = new ProviderRegistry();
registry.register("navidrome", (config) => new NavidromeProvider(config));
registry.register("telegram", (config) => new TelegramStorageProvider(config));

class ProviderManager {
    getProvider(session) {
        return this._registry.create(session.providerId, session.providerConfig);
    }
}
```

### Storage Provider Interface

Every storage provider implements:

| Method | Description |
|--------|-------------|
| `upload(filePath, uploadedBy)` | Upload file to storage, return metadata |
| `download(trackInternalId)` | Download file, return stream + headers |
| `delete(trackInternalId)` | Delete file from storage |
| `exists(trackInternalId)` | Check if file exists in storage |
| `health()` | Check provider connectivity |
| `verify(trackInternalId)` | Verify file integrity |

Storage providers do NOT implement: getAlbums, search, getArtists, etc. Those belong to the MetadataService.

### Telegram Provider Implementation

```js
class TelegramStorageProvider extends BaseProvider {
    async upload(filePath, uploadedBy) {
        // 1. Read file, compute SHA-256
        // 2. Check for duplicates via metadataService.findTrackByChecksum()
        // 3. Allocate channel via ChannelAllocator
        // 4. Upload to Telegram via bot API
        // 5. Return file metadata (channelId, messageId, fileId, etc.)
    }

    async download(trackInternalId) {
        // 1. Look up provider mapping
        // 2. Check temp cache (tmpDir)
        // 3. On miss: download from Telegram, save to cache
        // 4. Return Node.js readable stream
    }
}
```

---

## Channel Allocator

Pluggable channel selection strategy:

| Strategy | Behavior |
|----------|----------|
| `round_robin` (default) | Cycles through channels sequentially |
| `least_used` | Selects channel with fewest files |
| `random` | Random channel selection |

**Extending:** Add a new class extending `ChannelAllocator` and register it in the `allocators` map.

---

## Upload Pipeline

Full flow when a user uploads audio files:

```
1. Receive file(s) via multipart upload (multer)
2. File Scanner validates:
   - MIME type (audio/mpeg, audio/flac, audio/ogg, etc.)
   - File extension (.mp3, .flac, .ogg, .wav, .aac, .m4a, .opus)
   - File size (max 20MB — Bot API limit)
   - Magic bytes (ID3, FLAC, OGG, RIFF, MP4 signatures)
3. music-metadata extracts ID3 tags:
   - title, artist, album, genre, year, track number, duration, bitrate
4. SHA-256 checksum computed
5. Duplicate check: metadataService.findTrackByChecksum()
   - If exists: skip, return duplicate status
6. Internal IDs generated:
   - createArtist() → art_xxxxxxxx
   - createAlbum() → alb_xxxxxxxx
   - createTrack() → trk_xxxxxxxx
7. Channel allocation: ChannelAllocator.allocate()
8. Telegram upload: bot.api.sendDocument()
9. Store metadata in tracks, artists, albums tables
10. Store provider mapping in provider_mappings table
11. Return success with internal track ID
```

---

## Authentication Flow

### Telegram Login

```
1. Client selects Telegram on onboarding page
2. No credentials needed (bot token is server-level)
3. Client calls POST /api/auth/login { providerId: "telegram" }
4. Server validates TELEGRAM_BOT_TOKEN exists in env
5. Server creates/finds a shared "telegram_user" in users table
6. Server creates session with providerId: "telegram", providerConfig: { botConfigured: true }
7. Server issues JWT
8. Client stores JWT, redirects to home
```

### Navidrome Login (unchanged)

```
1. Client enters serverUrl + username + password
2. Server validates against Navidrome Subsonic API
3. Server stores salt+token in sessions table
4. Server issues JWT
```

---

## API Endpoints

### New Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/upload` | Upload audio files (multipart) | JWT |
| GET | `/api/upload/status` | Get library stats + channel info | JWT |
| POST | `/api/favorites/toggle` | Toggle favorite on a track | JWT |
| GET | `/api/favorites` | Get user's favorites | JWT |
| GET | `/api/admin/channels` | List Telegram channels | JWT |
| POST | `/api/admin/channels` | Register a Telegram channel | JWT |
| DELETE | `/api/admin/channels/:id` | Remove a Telegram channel | JWT |

### Modified Endpoints

All existing endpoints now handle both Telegram and Navidrome sessions:

| Endpoint | Telegram Behavior | Navidrome Behavior |
|----------|-------------------|-------------------|
| GET `/api/albums` | MetadataService.getAlbums() | NavidromeProvider.getAlbums() |
| GET `/api/albums/recent` | MetadataService.getRecentAlbums() | NavidromeProvider.getRecentAlbums() |
| GET `/api/albums/newest` | MetadataService.getNewestAlbums() | NavidromeProvider.getNewestAlbums() |
| GET `/api/albums/frequent` | MetadataService.getFrequentAlbums() | NavidromeProvider.getFrequentAlbums() |
| GET `/api/albums/:id` | MetadataService.getAlbumTracks() | NavidromeProvider.getAlbumTracks() |
| GET `/api/artists` | MetadataService.getArtists() | NavidromeProvider.getArtists() |
| GET `/api/artists/:id` | MetadataService.getArtist() | NavidromeProvider.getArtist() |
| GET `/api/tracks` | MetadataService.getSongs() | NavidromeProvider.getSongs() |
| GET `/api/tracks/random` | MetadataService.getRandomSongs() | NavidromeProvider.getRandomSongs() |
| GET `/api/tracks/starred` | MetadataService.getStarredItems() | NavidromeProvider.getStarredItems() |
| GET `/api/search` | MetadataService.search() | NavidromeProvider.search() |
| GET `/api/stream/:id` | TelegramProvider.download() | NavidromeProvider.getStream() |
| GET `/api/art/:id` | SVG placeholder | NavidromeProvider.getCover() |
| GET `/api/starred` | MetadataService.getStarredItems() | NavidromeProvider.getStarredItems() |

---

## MetadataService

The single source of truth for all Telegram metadata. Queries SQLite directly.

### Methods

| Method | Description |
|--------|-------------|
| `createArtist(name, coverUrl)` | Create or find artist, return internal ID |
| `createAlbum(name, artistDbId, year, coverUrl)` | Create or find album, return internal ID |
| `createTrack(metadata, albumDbId, artistDbId)` | Create track, return internal ID |
| `createProviderMapping(trackDbId, provider, fileData)` | Store provider mapping |
| `findTrackByChecksum(checksum)` | Duplicate detection |
| `findMappingByTrackId(internalId)` | Resolve track to provider mappings |
| `getAlbums(offset)` | List all albums |
| `getAlbumTracks(albumInternalId)` | Get album + its tracks |
| `getRecentAlbums(userId, size)` | Recently played albums |
| `getNewestAlbums(size)` | Newest by upload date |
| `getFrequentAlbums(userId, size)` | Most played albums |
| `getStarredItems(userId)` | User's favorites |
| `getSongs(offset)` | List all songs |
| `getRandomSongs(size)` | Random selection |
| `getArtists()` | List all artists |
| `getArtist(artistInternalId)` | Artist + their albums |
| `search(query)` | Full-text search across title, artist, album |
| `recordPlay(userId, trackInternalId)` | Record play event |
| `toggleFavorite(userId, trackInternalId)` | Toggle favorite status |

### Artist/Album Normalization

Artists and albums are deduplicated by name:

```js
// If "The Beatles" already exists, createTrack reuses the existing artist
const artist = metadataService.createArtist("The Beatles");
// Returns: { id: "art_xxx", dbId: 42 }  (existing)
// Or: { id: "art_yyy", dbId: 87 }  (newly created)
```

---

## Telegram Bot Service

 Grammy-based wrapper around the Telegram Bot API.

### Functions

| Function | Description |
|----------|-------------|
| `getBot()` | Get or create Grammy Bot instance |
| `uploadAudio(filePath, channelId, caption)` | Send document to channel, return file metadata |
| `downloadFile(fileId)` | Download file, return web ReadableStream |
| `deleteMessage(channelId, messageId)` | Delete a message |
| `getFileInfo(fileId)` | Get file info without downloading |
| `health()` | Check bot connectivity + get bot info |

### File Size Limit

Bot API hard limit: **20MB per file**. The scanner enforces this before upload.

Standard MP3 (320kbps, 5min): ~12MB ✓
FLAC (lossless, 5min): ~25MB ✗ (exceeds limit)

---

## File Scanner

Validates uploaded files before they reach Telegram.

### Checks

1. **File extension** — Must be: .mp3, .flac, .ogg, .wav, .aac, .m4a, .opus
2. **MIME type** — Must be audio/*
3. **File size** — Max 20MB (Bot API limit)
4. **Empty check** — File must not be empty
5. **Magic bytes** — First bytes must match known audio signatures:
   - `0x49 0x44 0x33` — ID3 (MP3)
   - `0xFF 0xFB/0xF3/0xF2` — MP3 sync
   - `0x66 0x4C 0x61 0x43` — FLAC
   - `0x4F 0x67 0x67 0x53` — OGG
   - `0x52 0x49 0x46 0x46` — RIFF (WAV)
   - `0x66 0x74 0x79 0x70` — MP4/M4A

---

## Client Changes

### Onboarding Page

Telegram is now an enabled provider alongside Navidrome:

- **Navidrome**: Shows configuration form (serverUrl, username, password)
- **Telegram**: No configuration needed (server-level bot token). Clicking immediately calls login with `providerId: "telegram"`

### Upload Page (`/upload`)

- Drag-and-drop zone for audio files
- File queue with size display
- "Upload All" button
- Results display: successful uploads, duplicates, failures
- Track IDs shown for successfully uploaded files

### Settings Page

- Shows provider info for both Navidrome and Telegram
- For Telegram: displays library stats (tracks, albums, artists, files on Telegram, storage channels)

### Navigation

- Upload link appears in sidebar and mobile nav only for Telegram provider users

---

## Environment Configuration

### `.env.example`

```env
# Server
PORT=5000
JWT_SECRET=change-this-to-a-random-secret

# Telegram Bot (from @BotFather)
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_ALLOCATOR_STRATEGY=round_robin
```

### Required Setup

1. Create a bot via @BotFather on Telegram
2. Add the bot as admin to your private storage channels
3. Copy the bot token to `TELEGRAM_BOT_TOKEN`
4. Register channels via API after server starts

### Registering Channels

```bash
# First, get a JWT by logging in
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"providerId":"telegram"}'

# Then register channels
curl -X POST http://localhost:5000/api/admin/channels \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"channel_id":"-1001234567890","title":"Storage-01"}'
```

---

## Testing Checklist

### Server

- [ ] Server starts without errors (`npm run dev`)
- [ ] SQLite database creates all tables on first run
- [ ] Telegram login returns JWT (`POST /api/auth/login`)
- [ ] Channel registration works (`POST /api/admin/channels`)
- [ ] Channel listing works (`GET /api/admin/channels`)

### Upload

- [ ] Upload accepts audio files (MP3, FLAC, etc.)
- [ ] Scanner rejects non-audio files
- [ ] Scanner rejects files > 20MB
- [ ] ID3 metadata extracted correctly
- [ ] Internal IDs generated (trk_, alb_, art_)
- [ ] Duplicate detection works (SHA-256)
- [ ] File uploaded to Telegram channel
- [ ] Metadata stored in SQLite
- [ ] Provider mapping stored

### Playback

- [ ] Audio streams from Telegram via `/api/stream/{trackId}`
- [ ] Play count recorded in play_history
- [ ] Audio plays in client without errors

### Metadata

- [ ] Albums list populated from SQLite
- [ ] Artists list populated from SQLite
- [ ] Search returns results
- [ ] Album detail shows tracks
- [ ] Artist detail shows albums
- [ ] Random songs endpoint works
- [ ] Favorites toggle works
- [ ] Starred items endpoint works

### Client

- [ ] Onboarding shows Telegram as enabled provider
- [ ] Telegram login works (no credentials needed)
- [ ] Upload page accessible from nav
- [ ] Upload page drag-and-drop works
- [ ] Albums/Artists/Search pages work with Telegram data
- [ ] Settings shows library stats
- [ ] Cover art shows placeholder (not broken image)

---

## Security

| Aspect | Implementation |
|--------|---------------|
| **Bot token** | Server-level env var, never sent to client |
| **Channel IDs** | Never exposed to client — only internal track IDs |
| **File IDs** | Never exposed — stored in provider_mappings only |
| **JWT auth** | All endpoints require valid JWT |
| **File scanning** | Malicious/invalid files rejected before upload |
| **Duplicate detection** | SHA-256 prevents re-uploading identical files |

---

## Dependencies Added

```json
{
    "grammy": "^1.x",         // Telegram Bot API
    "music-metadata": "^10.x", // ID3 tag extraction
    "mime-types": "^2.x",     // MIME type lookup
    "multer": "^2.x"          // Multipart file upload
}
```

---

## Future Phases

### Phase 2: Caching Layer
- L1: RAM cache for frequently accessed songs
- L2: SSD cache for recently downloaded songs
- L3: Telegram (current implementation)
- Stream-while-downloading for instant playback

### Phase 3: Background Workers
- Retry logic with exponential backoff
- Health monitoring for Telegram channels
- Structured logging
- Background prefetching

### Phase 4: Security
- AES-256-GCM encryption before upload
- Signed stream URLs
- Rate limiting
- File integrity verification

### Phase 5: Multi-Provider
- S3 storage provider
- Google Drive provider
- Dropbox provider
- Local file system provider
- Automatic storage balancing

---

## File Structure

```
server/
├── server.js                          # Main entry, route wiring
├── .env.example                       # Environment template
├── src/
│   ├── db/
│   │   ├── database.js                # SQLite connection + schema
│   │   └── ids.js                     # Internal ID generator
│   ├── middleware/
│   │   └── auth.js                    # JWT verification
│   ├── providers/
│   │   ├── base.js                    # Abstract base provider
│   │   ├── registry.js                # Provider Registry
│   │   ├── manager.js                 # Provider Manager (uses registry)
│   │   ├── channelAllocator.js        # Channel allocation strategies
│   │   ├── navidrome/index.js         # Navidrome full provider
│   │   └── telegram/index.js          # Telegram storage-only provider
│   ├── routes/
│   │   ├── authRoutes.js              # Login/register/me/logout
│   │   ├── albumRoutes.js             # Album endpoints
│   │   ├── artistRoutes.js            # Artist endpoints
│   │   ├── trackRoutes.js             # Track/starred endpoints
│   │   ├── searchRoutes.js            # Search endpoint
│   │   ├── streamRoutes.js            # Audio streaming proxy
│   │   ├── artRoutes.js               # Cover art proxy
│   │   ├── uploadRoutes.js            # File upload pipeline
│   │   ├── favoriteRoutes.js          # Favorites toggle/list
│   │   └── adminRoutes.js             # Channel management
│   ├── services/
│   │   └── metadataService.js         # SQLite metadata layer
│   └── telegram/
│       ├── bot.js                     # Grammy Bot wrapper
│       └── scanner.js                 # File validation

client/
└── src/
    ├── app/
    │   ├── onboarding/page.js          # Telegram enabled as provider
    │   ├── upload/page.js              # NEW: Upload UI
    │   └── settings/page.js            # Library stats for Telegram
    ├── services/
    │   └── authService.js              # Added Telegram login
    ├── store/
    │   └── authStore.js                # Updated login signature
    └── components/
        ├── Sidebar.js                  # Upload nav link
        └── MobileNav.js                # Upload nav link
```
