# Phase 0 Migration: Unified Server-Side Architecture

> Date: 2026-07-13
> Purpose: Migrate all provider logic from client to server, establishing a unified service-based API.

---

## Overview

**Before (old architecture):**
```
Client (browser)
  → NavidromeProvider (client-side)
    → Direct HTTP to Navidrome server (credentials in URL)
```

**After (new architecture):**
```
Client (browser)
  → ApiClient + Service Layer
    → Express server (JWT auth)
      → Provider Manager
        → Providers (Navidrome, Telegram later)
          → External APIs
```

**Key principle:** The frontend never knows which provider serves a track. It calls `albumService.getAlbums()` and the backend resolves it.

---

## New Architecture Diagram

```
Client
  ↓ (JWT Bearer token)
ApiClient (/services/apiClient.js)
  ↓
Service Layer (albumService, trackService, artistService, searchService)
  ↓
Express Routes (/api/albums, /api/stream, etc.)
  ↓
JWT Middleware (validates token, attaches session)
  ↓
Provider Manager (looks up credentials, picks provider)
  ↓
Providers (Navidrome, [Telegram later])
  ↓
External APIs (Navidrome Subsonic, Telegram Bot API)
```

---

## Server-Side Changes

### New Files

| File | Purpose |
|------|---------|
| `server/src/db/database.js` | SQLite connection singleton |
| `server/src/db/schema.js` | Table definitions (users, sessions) |
| `server/src/middleware/auth.js` | JWT verification middleware |
| `server/src/providers/base.js` | Abstract base provider class |
| `server/src/providers/navidrome/index.js` | Server-side Navidrome provider |
| `server/src/providers/manager.js` | Provider manager (routes to correct provider) |
| `server/src/routes/albumRoutes.js` | Album API endpoints |
| `server/src/routes/artistRoutes.js` | Artist API endpoints |
| `server/src/routes/trackRoutes.js` | Track/starred API endpoints |
| `server/src/routes/searchRoutes.js` | Search API endpoint |
| `server/src/routes/streamRoutes.js` | Audio streaming proxy (with Range support) |
| `server/src/routes/artRoutes.js` | Cover art proxy |

### Modified Files

| File | Changes |
|------|---------|
| `server/package.json` | Added `better-sqlite3`, `jsonwebtoken` |
| `server/src/routes/authRoutes.js` | Added register, JWT issuance, me, logout |
| `server/server.js` | Wired all new route groups |

### New Dependencies

- `better-sqlite3` — SQLite driver
- `jsonwebtoken` — JWT signing/verification

---

## Database Schema (SQLite)

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Active sessions (JWT-based)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- JWT jti claim
  user_id INTEGER NOT NULL,
  provider_id TEXT NOT NULL,
  provider_config TEXT NOT NULL,     -- JSON: {serverUrl, username, salt, token}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## New API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth/register` | Create new user | No |
| POST | `/api/auth/login` | Validate provider creds + issue JWT | No |
| GET | `/api/auth/me` | Get current session info | JWT |
| POST | `/api/auth/logout` | Delete session | JWT |

### Album Routes (`/api/albums`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/albums` | List albums (paginated, alphabetical) |
| GET | `/api/albums/recent` | Recently played albums |
| GET | `/api/albums/newest` | Newest albums |
| GET | `/api/albums/frequent` | Most played albums |
| GET | `/api/albums/:id` | Album detail + tracks |

### Artist Routes (`/api/artists`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/artists` | List all artists |
| GET | `/api/artists/:id` | Artist detail + albums |

### Track Routes (`/api/tracks`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tracks` | List songs (paginated) |
| GET | `/api/tracks/random` | Random songs |
| GET | `/api/starred` | Starred items (songs, albums, artists) |

### Search Routes (`/api/search`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/search` | Search songs, albums, artists |

### Streaming Routes (`/api/stream`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/stream/:trackId` | Stream audio (binary, Range support) |

### Art Routes (`/api/art`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/art/:albumId` | Get cover art image |

---

## Client-Side Changes

### New Files

| File | Purpose |
|------|---------|
| `client/src/services/apiClient.js` | Base HTTP client with JWT |
| `client/src/services/authService.js` | Auth API calls |
| `client/src/services/albumService.js` | Album API calls |
| `client/src/services/artistService.js` | Artist API calls |
| `client/src/services/trackService.js` | Track/starred API calls |
| `client/src/services/searchService.js` | Search API calls |

### Modified Files

| File | Changes |
|------|---------|
| `client/src/store/authStore.js` | Uses authService instead of providerManager |
| `client/src/store/playerStore.js` | Stream URL via trackService |
| `client/src/store/libraryStore.js` | Uses albumService |
| `client/src/app/page.js` | Uses service layer |
| `client/src/app/albums/page.js` | Uses albumService |
| `client/src/app/albums/[id]/page.js` | Uses albumService |
| `client/src/app/artists/page.js` | Uses artistService |
| `client/src/app/artists/[id]/page.js` | Uses artistService + albumService |
| `client/src/app/search/page.js` | Uses searchService |
| `client/src/app/library/songs/page.js` | Uses trackService |
| `client/src/app/library/favourites/page.js` | Uses trackService |
| `client/src/app/library/fav-artists/page.js` | Uses trackService |
| `client/src/app/onboarding/page.js` | Uses authService |
| `client/src/app/settings/page.js` | Uses authService |
| `client/src/components/ProtectedRoute.js` | Uses authService |

### Deleted Files

| File | Reason |
|------|--------|
| `client/src/providers/` (entire directory) | Provider logic moved to server |
| `client/src/core/engine.js` | Replaced by service layer |
| `client/src/core/providerManager.js` | Replaced by authService |
| `client/src/core/providerSession.js` | Replaced by JWT in localStorage |

### Kept Files

| File | Reason |
|------|---------|
| `client/src/core/models.js` | Factory functions still useful |
| `client/src/core/index.js` | Updated to export models only |
| `client/src/providers/registry.js` | Still used by onboarding page |

---

## Authentication Flow

### Old Flow
1. Client collects serverUrl + username + password
2. Server validates against Navidrome, returns salt+token
3. Client stores salt+token in localStorage
4. Every API call includes credentials in URL params
5. Audio URLs contain credentials (security risk)

### New Flow
1. Client collects serverUrl + username + password
2. Server validates against Navidrome, stores credentials in SQLite
3. Server issues JWT (contains sessionId, userId)
4. Client stores JWT in localStorage
5. Every API call includes JWT in Authorization header
6. Server proxies all requests (credentials never leave server)
7. Audio stream via `/api/stream/:trackId` (no credentials in URL)

---

## Security Improvements

| Before | After |
|--------|-------|
| Subsonic salt+token in localStorage | JWT in localStorage (scoped, expirable) |
| Credentials in every API URL | Credentials server-side only |
| Credentials in audio stream URLs | Stream via proxy (`/api/stream/:trackId`) |
| Credentials in cover art URLs | Art via proxy (`/api/art/:albumId`) |
| Hardcoded server IP | Environment variable or relative URL |
| No session expiry | JWT with configurable expiry |

---

## Data Flow Examples

### Loading Albums
```
1. Client: albumService.getAlbums(0)
2. ApiClient: GET /api/albums?offset=0 (with JWT header)
3. Express: JWT middleware validates token, attaches session
4. Express: albumRoutes handler calls ProviderManager
5. ProviderManager: Creates NavidromeProvider with stored credentials
6. NavidromeProvider: Calls getAlbumList2.view on Navidrome
7. Express: Returns normalized album data to client
8. Client: Renders album grid
```

### Playing a Track
```
1. Client: setQueue(tracks, index) → loadTrack()
2. Player: audio.src = trackService.getStreamUrl(trackId)
3. Browser: GET /api/stream/:trackId (with JWT)
4. Express: JWT middleware validates token
5. Express: StreamRoutes calls ProviderManager
6. NavidromeProvider: Calls stream.view on Navidrome with credentials
7. Express: Pipes binary stream to client (supports Range requests)
8. Browser: Plays audio
```

---

## Migration Steps (Implementation Order)

1. Install server dependencies
2. Set up SQLite database
3. Create JWT auth middleware
4. Update auth routes
5. Create server-side provider system
6. Create all Express API routes
7. Wire routes in server.js
8. Create client API client + services
9. Refactor client stores
10. Update all pages
11. Update onboarding page
12. Delete old provider system
13. Test full flow

---

## Rollback Plan

If issues arise, the old client-side provider system can be restored from git history. The migration is atomic — all changes work together.

---

## Future Phases

After Phase 0, the architecture supports:

- **Phase 1:** Telegram provider (add `server/src/providers/telegram/index.js`)
- **Phase 2:** Caching layer (RAM + SSD cache for streams)
- **Phase 3:** Background workers (retry, health monitoring)
- **Phase 4:** Security enhancements (rate limiting, signed URLs)
- **Phase 5:** Multi-provider support (Jellyfin, S3, etc.)

---

## Notes

- The `client/src/core/models.js` factory functions are retained for client-side data normalization
- The provider registry (`client/src/providers/registry.js`) is still used by the onboarding page to list available providers
- Playlist functionality remains client-side (localStorage) for now
- The hardcoded IP address (`http://192.168.1.11:5000`) is removed
