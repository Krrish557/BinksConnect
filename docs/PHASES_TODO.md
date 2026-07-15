# BinksConnect — Future Phases

> Created: 2026-07-15
> Status: Planning (not yet implemented)

---

## Phase 3: Artist Normalization + Playback Polish

### 3A. Artist Name Normalization & Album Artist

**Problem:**
When tracks have featured artists (e.g. "Seedhe Maut x Krsna", "Seedhe Maut feat. Krsna"), the current scanner creates a single combined artist record. This results in:
- Duplicate/fragmented artist entries: "Seedhe Maut x Krsna", "Seedhe Maut", "Krsna" as 3 separate artists
- Artists page becomes cluttered with collaboration variants
- Albums incorrectly attributed to the combined artist instead of the primary artist

**Goal:**
- First artist name in metadata = **album artist** (primary artist)
- Featured/collaboration artists are split into separate, normalized artist records
- Common songs appear in both artists' discographies
- Clean, deduplicated Artists and Albums pages

**Implementation:**

#### 3A.1 Artist Name Parsing

Add a utility function `parseArtists(rawArtist)` that handles common collaboration formats:

```
Input formats to handle:
  "Seedhe Maut x Krsna"           → ["Seedhe Maut", "Krsna"]
  "Seedhe Maut feat. Krsna"       → ["Seedhe Maut", "Krsna"]
  "Seedhe Maut ft Krsna"          → ["Seedhe Maut", "Krsna"]
  "Seedhe Maut, Krsna"            → ["Seedhe Maut", "Krsna"]
  "Seedhe Maut / Krsna"           → ["Seedhe Maut", "Krsna"]
  "Seedhe Maut & Krsna"           → ["Seedhe Maut", "Krsna"]
  "Seedhe Maut vs Krsna"          → ["Seedhe Maut", "Krsna"]
  "Various Artists"               → ["Various Artists"]
  "A.R. Rahman"                   → ["A.R. Rahman"] (no split)
  "Arijit Singh"                  → ["Arijit Singh"] (no split)

Split tokens (case-insensitive): x, feat, ft, &, vs, with
Comma and / are also split tokens but only between known artist names
```

**File:** `server/src/services/metadataService.js` (or new `server/src/utils/artistParser.js`)

#### 3A.2 Database Schema Changes

Add `album_artist_id` column to `tracks` table:

```sql
ALTER TABLE tracks ADD COLUMN album_artist_id INTEGER REFERENCES artists(id);
```

- `artist_id` = the performing artist (first in the split list, or the only artist)
- `album_artist_id` = the album artist (always the first/primary artist)

For tracks with no artist, both remain NULL.

#### 3A.3 Metadata Service Changes

- `createArtist(name)` — normalize name before insert (trim, consistent casing for lookup)
- New `findOrCreateArtist(name)` — check if normalized name exists, return existing or create new
- `createTrack()` — now also sets `album_artist_id` from the first parsed artist
- `createAlbum()` — associate with album_artist_id (first artist), not the combined string

#### 3A.4 Scanner Changes (`channelScanner.js`)

Current flow:
```
raw artist string → createArtist(combined) → single artist_id
```

New flow:
```
raw artist string → parseArtists() → [primary, feat1, feat2, ...]
  → primary artist → findOrCreateArtist() → primary_artist_id
  → each feat artist → findOrCreateArtist() → feat_artist_id
  → createTrack() with artist_id = primary_artist_id, album_artist_id = primary_artist_id
  → link feat artists to track via new track_artists junction table (optional, for "appears on" feature)
```

#### 3A.5 New Junction Table (Optional — for "Appears On")

```sql
CREATE TABLE track_artists (
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'primary',  -- 'primary', 'featured', 'remixer'
    PRIMARY KEY (track_id, artist_id)
);
```

This allows querying "all tracks where Krsna appears" regardless of whether they're the primary or featured artist.

#### 3A.6 Frontend Changes

- **Artists page:** Shows clean, deduplicated artist list
- **Artist detail page:** Shows albums where they're the album artist + tracks where they appear as featured
- **Album detail page:** Shows album artist (not the combined string)
- **Search:** Searches against normalized artist names

#### 3A.7 Migration for Existing Data

A one-time migration script to:
1. Parse all existing `artists.name` values
2. Split combined names into individual artists
3. Update `tracks.artist_id` and set `tracks.album_artist_id`
4. Create junction table entries
5. Deduplicate artist records

---

### 3B. Playback & Queue Improvements

#### 3B.1 Queue Persistence

**Problem:** Queue is lost on page reload (stored only in Zustand memory).

**Solution:**
- Save queue state to `localStorage` on every change (currentTrack, queue, currentIndex)
- Restore on app load
- Use Zustand `persist` middleware (like playlists store already does)
- Exclude transient state (isPlaying, currentTime, duration) from persistence

**File:** `client/src/store/playerStore.js`

#### 3B.2 Keyboard Shortcuts

**Mappings:**
| Key | Action |
|-----|--------|
| Space | Play/Pause |
| → (Right arrow) | Seek forward 5s |
| ← (Left arrow) | Seek backward 5s |
| Shift+→ | Next track |
| Shift+← | Previous track |
| M | Mute/Unmute |
| F | Toggle fullscreen player |
| S | Toggle shuffle |
| R | Cycle repeat (off → all → one) |

**Implementation:**
- Global `keydown` listener in `AppLayout.js`
- Ignore when focus is on input/textarea elements
- Add a mini keyboard shortcuts help panel (triggered by `?` key)

**File:** `client/src/components/AppLayout.js` (or new `components/KeyboardShortcuts.js`)

#### 3B.3 Media Session API

**Purpose:** Lock screen controls on mobile, notification media controls on desktop.

**Implementation:**
- Set `navigator.mediaSession.metadata` when track changes (title, artist, album, artwork)
- Set action handlers: `play`, `pause`, `previoustrack`, `nexttrack`, `seekbackward`, `seekforward`
- Artwork array from `/api/art/:albumId?size=thumb`

**File:** `client/src/store/playerStore.js` (update on track change)

#### 3B.4 Volume Persistence

**Implementation:**
- Save `volume` to `localStorage` on change
- Restore on app load
- Include in Zustand persist middleware alongside queue

**File:** `client/src/store/playerStore.js`

#### 3B.5 Favorite Button in FullPlayer

**Problem:** The heart/`♡` button in FullPlayer is static HTML — it doesn't do anything.

**Implementation:**
- Wire up to the existing favourite/starred API (`POST /api/starred` / `DELETE /api/starred`)
- Toggle visual state (filled ♡ when favorited, outline when not)
- Check favourite status on track load
- Also add favourite toggle to `SongRow` context menu and `BottomPlayer`

**Files:** `client/src/components/FullPlayer.js`, `client/src/components/BottomPlayer.js`, `client/src/components/SongRow.js`

---

## Phase 4: Lyrics + Queue Reordering + Context Menu ✅

> Implemented: 2026-07-15

### 4A. Server — Track artistId + Lyrics infrastructure

- Added `artistId` to all track mappings in `metadataService.js` (7 song mapping locations)
- Created `lyrics_cache` table in `database.js`
- Created `server/src/services/lyricsService.js` — LRCLIB primary, Genius fallback, SQLite cache
- Created `server/src/routes/lyricsRoutes.js` — `GET /api/lyrics/:trackInternalId`
- Registered lyrics route in `server.js`

### 4B. Queue Reordering (@dnd-kit)

- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **QueueItem** — wraps in `useSortable()`, has drag handle (`⠿`), context menu (Play Next, Remove from Queue, Go to Album/Artist)
- **FullPlayer** — wraps queue in `<DndContext>` + `<SortableContext>`, `onDragEnd` calls `reorderQueue()`

### 4C. PlayerStore — New actions

| Action | Description |
|--------|-------------|
| `addToQueue(track)` | Append track to end of queue |
| `playNext(track)` | Insert track after current playing |
| `removeFromQueue(index)` | Remove track, adjust currentIndex |
| `reorderQueue(from, to)` | Drag-reorder, track currentTrack |
| `fetchLyrics(track)` | Fetch from `/api/lyrics`, store in state |

### 4D. Expanded SongRow Context Menu

Menu items:
1. Toggle favorite *(existing)*
2. **Play Next** *(new)*
3. **Add to Queue** *(new)*
4. *(separator)*
5. **Go to Album** *(new)* — navigates `/albums/${albumId}`
6. **Go to Artist** *(new)* — navigates `/artists/${artistId}`
7. *(separator)*
8. Add to playlist... *(existing)*

### 4E. Lyrics in FullPlayer

- **Lyrics tab** alongside "Up Next" in FullPlayer
- Fetches lyrics on tab open
- Renders `SyncedLyrics` component
- Synced highlighting, auto-scroll, click-to-seek
- Instrumental and "not found" states handled

### Files created/modified

| Action | File |
|--------|------|
| Created | `server/src/services/lyricsService.js` |
| Created | `server/src/routes/lyricsRoutes.js` |
| Created | `client/src/services/lyricsService.js` |
| Created | `client/src/components/SyncedLyrics.js` |
| Modified | `server/src/services/metadataService.js` (artistId) |
| Modified | `server/src/db/database.js` (lyrics_cache table) |
| Modified | `server/server.js` (register lyrics route) |
| Modified | `client/src/store/playerStore.js` (queue actions + lyrics) |
| Modified | `client/src/components/SongRow.js` (expanded menu) |
| Modified | `client/src/components/QueueItem.js` (DnD + context menu) |
| Modified | `client/src/components/FullPlayer.js` (DnD + lyrics tab) |

---

### 4.6 Edge Cases

---

## Phase 5: Server-side Playlists + Library Management ✅

> Implemented: 2026-07-15

### 5.1 Server-side Playlists

- **DB:** `playlists` + `playlist_tracks` tables with proper FK constraints
- **API:** Full CRUD at `/api/playlists` — list, create, get, rename, delete, add/remove tracks, reorder
- **Store:** Rewrote `playlistStore.js` — API-backed with localStorage offline cache + auto-migration
- **Auto-migrate:** On first load, if localStorage has playlists and server has none, pushes them to server

### 5.2 Extended Favourites

- **DB:** `favourite_artists` + `favourite_albums` tables
- **API:** Extend `/api/favorites` — toggle, check, list for artists and albums
- **Frontend:** Heart toggle on `ArtistCard` and `AlbumCard` (hover to reveal, persisted to server)
- **Service:** `favouriteService.js` for all favourite API calls

### 5.3 FTS5 Search

- **DB:** FTS5 virtual tables (`tracks_fts`, `artists_fts`, `albums_fts`) + triggers for auto-sync
- **Search:** `metadataService.searchFTS5()` — ranked results, graceful fallback to LIKE if FTS5 unavailable
- **Route:** `searchRoutes.js` now calls `searchFTS5()` instead of `search()`

### 5.4 Smart Playlists

- **DB:** `smart_playlists` table (name, rule_type, rule_limit)
- **API:** `/api/smart-playlists` — list, create, evaluate, delete
- **Rules:** most_played, recently_added, frequently_played, forgotten_gems, random
- **Frontend:** Playlists page shows smart playlists with expand/collapse, inline track preview
- **Service:** `smartPlaylistService.js`

### 5.5 Playlist DnD Reorder

- Playlist detail page wraps tracks in `@dnd-kit` DnD context
- Drag handle (`⠿`) on each row, `onDragEnd` calls `PUT /api/playlists/:id/reorder`
- Uses `SortableContext` + `useSortable` (same pattern as FullPlayer queue)

### Files created/modified

| Action | File |
|--------|------|
| Create | `server/src/routes/playlistRoutes.js` |
| Create | `server/src/routes/smartPlaylistRoutes.js` |
| Create | `client/src/services/playlistService.js` |
| Create | `client/src/services/favouriteService.js` |
| Create | `client/src/services/smartPlaylistService.js` |
| Modify | `server/src/db/database.js` (4 new tables + FTS5 + triggers) |
| Modify | `server/src/services/metadataService.js` (playlist CRUD + favourites + FTS5 + smart playlists) |
| Modify | `server/server.js` (register playlist + smart playlist routes) |
| Modify | `server/src/routes/favoriteRoutes.js` (add artist/album endpoints) |
| Modify | `server/src/routes/searchRoutes.js` (use FTS5) |
| Modify | `client/src/store/playlistStore.js` (API-backed + auto-migration) |
| Modify | `client/src/components/ArtistCard.js` (favourite toggle) |
| Modify | `client/src/components/AlbumCard.js` (favourite toggle) |
| Modify | `client/src/app/playlists/[id]/page.js` (DnD reorder) |
| Modify | `client/src/app/playlists/page.js` (smart playlists section) |

---

## Phase 6: Standalone Lyrics Page + Edge Case Hardening ✅

> Implemented: 2026-07-15

### 6A. Standalone `/lyrics` Page

- Full-screen lyrics view with blurred album cover background + dark overlay
- Reads `currentTrack`, `currentTime`, `lyrics` from player store
- Auto-fetches lyrics when a track is playing
- Listens for `lyricsSeek` custom event for click-to-seek
- Escape key to go back
- Empty state when no track is playing

### 6B. Critical Bug Fixes (Tier 1)

- **`getFavouriteArtists()`** — Added missing `WHERE fa.user_id = ?` clause (was leaking all users' favorites)
- **`getFavouriteAlbums()`** — Same fix
- **`forgotten_gems` smart playlist** — Fixed table name `favourites` → `favorites`

### 6C. Crash Fixes (Tier 2)

- **`next()` empty queue** — Early return prevents `Math.random() * 0` crash
- **`next()` end of queue** — Now explicitly sets `isPlaying: false` so UI reflects stopped state
- **`removeFromQueue` last item** — When queue empties, sets `currentTrack: null`, pauses audio, resets state
- **`setQueue` validation** — Guards against empty tracks array and clamps out-of-bounds startIndex
- **`lyricsService` JSON.parse** — Wrapped corrupted cache reads in try/catch
- **`lyricsService` HTTP timeout** — Added `AbortSignal.timeout(8000)` to all external fetches
- **`play()` error** — Logs warning instead of silently swallowing

### 6D. Validation & Robustness (Tier 3)

- **Playlist create** — Validates name is non-empty, trimmed, max 200 chars
- **Smart playlist create** — Clamps `ruleLimit` to 1–500
- **Smart playlist delete** — Returns 404 if not found (was always 200)
- **Favourite check endpoints** — Caps array size at 100 elements per request
- **LIKE wildcard escaping** — Escapes `%` and `_` in search queries to prevent wildcard injection
- **Search query length** — Caps at 200 chars, returns 400 if exceeded
- **Error message leaks** — Lyrics and search routes now return generic error strings
- **QueueItem null guard** — Returns null if track prop is undefined (moved after hooks)
- **Playlist reorder** — Requires non-empty `trackIds` array

### 6E. Cleanup (Tier 4)

- **`deleteTrack`** — Now cleans up `favorites`, `playlist_tracks`, `track_artists`, and `lyrics_cache` rows before deleting the track

### Files modified

| Action | File |
|--------|------|
| Rewrite | `client/src/app/lyrics/page.js` (stub → full lyrics page) |
| Modify | `server/src/services/metadataService.js` (3 critical SQL fixes, LIKE escaping, deleteTrack cleanup, deleteSmartPlaylist return) |
| Modify | `server/src/routes/playlistRoutes.js` (name validation, empty trackIds) |
| Modify | `server/src/routes/smartPlaylistRoutes.js` (ruleLimit validation, 404) |
| Modify | `server/src/routes/favoriteRoutes.js` (array size cap) |
| Modify | `server/src/routes/lyricsRoutes.js` (error message leak) |
| Modify | `server/src/routes/searchRoutes.js` (query length, error message leak) |
| Modify | `server/src/services/lyricsService.js` (JSON.parse safety, HTTP timeout) |
| Modify | `client/src/store/playerStore.js` (empty queue fixes, isPlaying reset, setQueue guard, play error logging) |
| Modify | `client/src/components/QueueItem.js` (null guard after hooks) |

---

## Phase Order & Dependencies

```
Phase 3 (Scanner Fixes + Artist Normalization + Playback Polish)
  ├── 3A: Artist Normalization (independent)
  ├── 3B: Queue Persistence (independent)
  ├── 3C: Keyboard Shortcuts (independent)
  ├── 3D: Media Session API (depends on 3B)
  └── 3E: Favorite Button (independent)

Phase 4 (Lyrics)
  ├── 4A: LRCLIB integration (independent)
  ├── 4B: Lyrics caching (depends on 4A)
  ├── 4C: SyncedLyrics component (depends on 4A)
  ├── 4D: FullPlayer lyrics tab (depends on 4C)
  └── 4E: Lyrics page (depends on 4C)

Phase 5 (Playlists + Library)
  ├── 5A: Server-side playlists (independent)
  ├── 5B: Favourites system (independent)
  ├── 5C: Search improvements (independent)
  ├── 5D: Drag-and-drop reorder (depends on 5A)
  └── 5E: Smart playlists (depends on 5A + 5B)
```

---

## Scanner Fixes (Completed 2026-07-15)

These were implemented before the phases document:

### Fix 1: ENOENT from Special Characters
- **Problem:** Filenames with `"`, `\`, `/` etc. broke Windows temp file paths
- **Fix:** Added `sanitizeFileName()` function that replaces `<>:"/\|?*` and control characters with `_`
- **File:** `server/src/telegram/channelScanner.js`

### Fix 2: Fetch Failed / Network Errors
- **Problem:** Telegram download API calls failed with no retry
- **Fix:** Added `downloadWithRetry()` with 1 retry after 2 second delay
- **File:** `server/src/telegram/channelScanner.js`

### Fix 3: Terminated from Concurrency Flood
- **Problem:** Media groups (multiple audio files at once) all triggered simultaneous scans, overwhelming the process
- **Fix:** Added `enqueueScan()` semaphore limiting to 2 concurrent scans, queuing the rest
- **File:** `server/src/telegram/bot.js`
