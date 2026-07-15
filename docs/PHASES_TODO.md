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

## Phase 5: Server-side Playlists + Library Management

### 5.1 Server-side Playlist Persistence

**Problem:** Playlists are currently localStorage-only via Zustand persist. They're lost on cache clear, not shared across devices, and not accessible via API.

#### 5.1.1 Database Schema

```sql
CREATE TABLE playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    internal_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE playlist_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE(playlist_id, track_id)
);
```

#### 5.1.2 API Routes

**File:** `server/src/routes/playlistRoutes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/playlists` | List all playlists (with track count, duration) |
| `POST` | `/api/playlists` | Create playlist `{ name, description? }` |
| `PUT` | `/api/playlists/:id` | Rename playlist `{ name }` |
| `DELETE` | `/api/playlists/:id` | Delete playlist |
| `GET` | `/api/playlists/:id` | Get playlist with tracks |
| `POST` | `/api/playlists/:id/tracks` | Add track `{ trackId, position? }` |
| `DELETE` | `/api/playlists/:id/tracks/:trackId` | Remove track |
| `PUT` | `/api/playlists/:id/reorder` | Reorder tracks `{ trackIds: [ordered ids] }` |

#### 5.1.3 Frontend Migration

- Migrate existing localStorage playlists to server on first load
- Replace `usePlaylistStore` (localStorage) with API-backed store
- Add optimistic updates for smooth UX
- Keep localStorage as offline fallback/cache

#### 5.1.4 Playlist UI Improvements

- Drag-and-drop reordering in playlist view
- "Add to Playlist" context menu on SongRow, search results, album track lists
- Playlist mosaic cover (auto-generate from first 4 track album arts)
- Share playlist link (public read-only endpoint, optional)

### 5.2 Server-side Favourites

**Problem:** Favourites are provider-specific. Need a unified, provider-agnostic favourite system.

#### 5.2.1 Database Schema

```sql
CREATE TABLE favourites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    track_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
    UNIQUE(user_id, track_id)
);

CREATE TABLE favourite_artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    artist_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    UNIQUE(user_id, artist_id)
);

CREATE TABLE favourite_albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    album_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    UNIQUE(user_id, album_id)
);
```

#### 5.2.2 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/favourites` | Get all favourited tracks |
| `POST` | `/api/favourites` | Add favourite `{ trackId }` |
| `DELETE` | `/api/favourites/:trackId` | Remove favourite |
| `GET` | `/api/favourites/artists` | Get favourited artists |
| `POST` | `/api/favourites/artists` | Favourite artist `{ artistId }` |
| `DELETE` | `/api/favourites/artists/:artistId` | Unfavourite artist |
| `GET` | `/api/favourites/albums` | Get favourited albums |
| `POST` | `/api/favourites/albums` | Favourite album `{ albumId }` |
| `DELETE` | `/api/favourites/albums/:albumId` | Unfavourite album |

### 5.3 Improved Search

**Problem:** Current search uses basic SQL `LIKE %query%` which is slow and imprecise.

#### 5.3.1 SQLite FTS5

```sql
CREATE VIRTUAL TABLE tracks_fts USING fts5(
    title, artist_name, album_name,
    content='tracks',
    content_rowid='id'
);

CREATE VIRTUAL TABLE artists_fts USING fts5(
    name,
    content='artists',
    content_rowid='id'
);

CREATE VIRTUAL TABLE albums_fts USING fts5(
    name,
    content='artists',  -- for artist name search in albums
    content_rowid='id'
);
```

#### 5.3.2 Search Improvements

- FTS5 for fast full-text search with ranking
- Typo tolerance via trigram tokenizer (SQLite extension) or application-level fuzzy matching
- Search results ranked by relevance (title match > artist match > album match)
- Recent searches stored in localStorage
- Search suggestions/autocomplete

### 5.4 Smart Playlists (Stretch Goal)

Auto-generated playlists based on rules:

| Smart Playlist | Rule |
|----------------|------|
| Most Played | Top N tracks by play count |
| Recently Added | Tracks added in last N days |
| Top Rated | Tracks with most favourites |
| Forgotten Gems | Tracks not played in 30+ days but favourited |
| Genre Mix | Random tracks from a specific genre |

**Implementation:**
- Store smart playlist rules in a `smart_playlists` table
- Evaluate rules on access (not cron — compute on demand)
- Cache results for 5 minutes
- UI: Special "Smart" section in Playlists page

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
