# Phase 3: Artist Normalization + Playback Polish — Complete

> Completed: 2026-07-15
> Status: Done

---

## 3A. Artist Name Normalization & Album Artist

### 3A.1 Artist Name Parser
- **File:** `server/src/utils/artistParser.js` (new)
- `parseArtists(raw)` — splits on `x`, `feat`, `ft`, `&`, `vs`, `with`, `,`, `/` (case-insensitive)
- Preserves multi-word names (e.g. "Seedhe Maut", "Rebel 7")
- `getPrimaryArtist(raw)` — returns first parsed artist
- `normalizeArtistName(name)` — trim + lowercase for deduplication

### 3A.2 Database Schema
- **File:** `server/src/db/database.js`
- Added `album_artist_id INTEGER REFERENCES artists(id)` column to `tracks`
- Added `track_artists` junction table: `(track_id, artist_id, role TEXT DEFAULT 'primary')`
- Added `schema_migrations` table for tracking applied migrations
- Added index `idx_track_artists_artist`

### 3A.3 Metadata Service
- **File:** `server/src/services/metadataService.js`
- `findOrCreateArtist(name)` — normalized lookup, creates if not found
- `linkTrackArtist(trackDbId, artistDbId, role)` — inserts into junction table
- `checkFavorites(userId, trackIds)` — batch check favorite status
- `getFeaturedTracks(artistInternalId)` — tracks where artist appears as featured
- `createTrack()` — now accepts `albumArtistDbId` parameter
- `getArtist()` — returns `featuredTracks` array
- `getArtists()` — filters to artists with data, returns `coverArt: /api/art/artist/{id}`
- `getAlbums()` — filters out empty albums (0 tracks)
- `search()` — returns artist `coverArt` URLs
- All artist queries return `/api/art/artist/{id}` for cover art instead of null `cover_url`

### 3A.4 Scanner Changes
- **File:** `server/src/telegram/channelScanner.js`
- Uses `parseArtists()` to split raw artist string
- Creates primary artist via `findOrCreateArtist()`
- Creates featured artists via `findOrCreateArtist()` + `linkTrackArtist()`
- Sets album_artist_id to primary artist
- Updates cover art for both primary AND featured artists on scan

### 3A.5 Auto-Migration
- **File:** `server/src/db/database.js` (`runMigrations()`)
- Runs automatically on server startup if `artist_normalization` migration not yet applied
- Steps:
  1. Deduplicates artists with same normalized name
  2. Parses combined artist names, reassigns `artist_id` + `album_artist_id` to primary
  3. Creates `track_artists` junction entries (primary + featured)
  4. Fixes album `artist_id` to point to primary artist
  5. Merges duplicate albums (same name + same artist_id)
  6. Deletes orphaned combined artist records
  7. Sets artist covers from most recent album cover art

### 3A.6 Frontend
- **File:** `client/src/app/artists/[id]/page.js`
- Shows artist cover image (from `/api/art/artist/{id}`)
- Shows "Appears On" section for featured tracks
- Shows featured track count in header
- **File:** `client/src/components/ArtistCard.js`
- Reads `artist.coverArt` and resolves via `apiClient.resolveUrl()`

---

## 3B. Playback & Queue Improvements

### 3B.1 Queue Persistence
- **File:** `client/src/store/playerStore.js`
- Zustand `persist` middleware saves to `localStorage` (key: `binks_player`)
- Persisted: `queue`, `currentIndex`, `currentTrack`, `volume`, `isShuffle`, `isRepeat`
- Excluded (transient): `isPlaying`, `currentTime`, `duration`, `isReady`
- New actions: `seekForward()`, `seekBackward()`, `toggleMute()`

### 3B.2 Keyboard Shortcuts
- **File:** `client/src/components/KeyboardShortcuts.js` (new)
- Mounted in `AppLayout.js`
- Global `keydown` listener (skips input/textarea elements)
- Mappings:
  - `Space` — Play/Pause
  - `←/→` — Seek backward/forward 5s
  - `Shift+←/→` — Previous/Next track
  - `M` — Mute/Unmute
  - `F` — Toggle fullscreen player
  - `S` — Toggle shuffle
  - `R` — Cycle repeat
  - `?` — Show/hide shortcuts help panel

### 3B.3 Media Session API
- **File:** `client/src/store/playerStore.js` (`loadTrack()`)
- Sets `navigator.mediaSession.metadata` on track change (title, artist, album, artwork)
- Enables lock screen controls on mobile, notification media controls on desktop

### 3B.4 Favorite Button
- **Server:** `POST /api/favorites/check` endpoint (batch check)
  - **File:** `server/src/routes/favoriteRoutes.js`
  - **File:** `server/src/services/metadataService.js` (`checkFavorites()`)
- **Client service:** `trackService.toggleFavorite()`, `trackService.checkFavorites()`
  - **File:** `client/src/services/trackService.js`
- **FullPlayer** — heart button toggles favorite (filled ♥ / outline ♡)
  - **File:** `client/src/components/FullPlayer.js`
- **BottomPlayer** — heart button next to volume slider
  - **File:** `client/src/components/BottomPlayer.js`
- **SongRow** — favorite toggle in context menu (always visible, not just when playlists exist)
  - **File:** `client/src/components/SongRow.js`

### 3B.5 Keyboard Shortcuts Help Panel
- Triggered by `?` key, dismissed by `Escape` or clicking outside
- Shows all key bindings in a modal overlay

---

## Files Modified

| File | Changes |
|------|---------|
| `server/src/utils/artistParser.js` | **New** — artist name parsing utility |
| `server/src/db/database.js` | Schema additions, auto-migration, album dedup |
| `server/src/services/metadataService.js` | findOrCreateArtist, checkFavorites, cover URLs, album filtering |
| `server/src/telegram/channelScanner.js` | Artist parsing, featured artist linking, cover art for all artists |
| `server/src/routes/favoriteRoutes.js` | Added POST /check endpoint |
| `client/src/store/playerStore.js` | Persist middleware, Media Session API, seekForward/Back, toggleMute |
| `client/src/components/AppLayout.js` | Added KeyboardShortcuts component |
| `client/src/components/KeyboardShortcuts.js` | **New** — keyboard shortcuts + help panel |
| `client/src/components/FullPlayer.js` | Favorite toggle, favorite status check |
| `client/src/components/BottomPlayer.js` | Favorite toggle |
| `client/src/components/SongRow.js` | Favorite toggle in context menu |
| `client/src/components/ArtistCard.js` | Reads coverArt from artist object |
| `client/src/app/artists/[id]/page.js` | Artist cover image, "Appears On" section |
| `client/src/services/trackService.js` | toggleFavorite, checkFavorites methods |

## Issues Fixed During Implementation

1. **Orphaned combined artist records** — 25 empty records like "Seedhe Maut, Sez On The Beat" cleaned up (89 → 64 artists)
2. **Artist covers not in API** — `getArtists()` returned null `cover_url`; changed to return `/api/art/artist/{id}` URLs
3. **ArtistCard not using cover data** — Component expected unused `coverUrl` prop; fixed to read `artist.coverArt`
4. **Duplicate albums** — Same album name with different artist_ids created separate records; merged duplicates
5. **Albums with 0 tracks showing** — Added WHERE filter to `getAlbums()`
6. **Migration not reassigning artist_id** — Updated migration to also update `tracks.artist_id` (not just `album_artist_id`)
