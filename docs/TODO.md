# BinksConnect — TODO

## Telegram Provider
- [ ] Server: Set up GramJS MTProto client (`server/src/telegram/client.js`)
- [ ] Server: Implement phone number + code auth flow
- [ ] Server: Save/load GramJS session strings securely
- [ ] Server: Build channel crawler — iterate audio messages from specified channels
- [ ] Server: Parse audio metadata (ID3 tags, filename, captions, thumbnails)
- [ ] Server: Build album/artist grouping heuristics from raw channel posts
- [ ] Server: Index tracks into a local store (JSON or SQLite)
- [ ] Server: Create REST API routes (`/api/telegram/*`)
- [ ] Server: Implement audio stream proxy with HTTP Range request support
- [ ] Server: Handle Telegram file reference expiry + refresh
- [ ] Server: Add rate limit / flood wait handling with exponential backoff
- [ ] Client: Create Telegram provider class (`client/src/providers/telegram/index.js`)
- [ ] Client: Implement all provider interface methods (getAlbums, getSongs, getArtists, search, etc.)
- [ ] Client: Add Telegram onboarding flow — API ID/Hash input → phone → verification code
- [ ] Client: Remove Telegram from COMING_SOON list in onboarding page
- [ ] Client: Register Telegram provider in provider registry

## Lyrics
- [ ] Set up lyrics provider (Genius API or alternative)\n
- [ ] Build lyrics fetch endpoint on server
- [ ] Implement lyrics side panel in full player
- [ ] Create lyrics page with synced/highlighted lyrics view
- [ ] Handle instrumental / no-lyrics states gracefully

## Queue & Playback
- [ ] Implement queue reordering (drag-and-drop)
- [ ] Add queue persistence across page reloads
- [ ] Add volume persistence across sessions
- [ ] Implement gapless playback
- [ ] Implement crossfade between tracks
- [ ] Add audio equalizer / visualizer
- [ ] Implement keyboard shortcuts (space=play/pause, arrows=seek, etc.)

## Favourites & Library
- [ ] Add album favouriting toggle UI
- [ ] Add artist favouriting toggle UI
- [ ] Persist favourites server-side (currently Navidrome-only)
- [ ] Add "Add to Playlist" context menu option for tracks

## Database
- [ ] Set up MongoDB connection
- [ ] Create User model (local auth + provider sessions)
- [ ] Create Playlist model (server-side persistence)
- [ ] Create ListeningHistory model
- [ ] Create PlayCount / scrobble tracking
- [ ] Create UserPreferences model (volume, repeat, shuffle defaults)
- [ ] Migrate local playlists from localStorage to DB
- [ ] Implement JWT session tokens

## Cross-Device Sync
- [ ] Set up Socket.IO server
- [ ] Implement real-time queue sync across devices
- [ ] Implement live playback position sync
- [ ] Implement transfer playback between devices
- [ ] Add online status / device presence indicators

## Multi-Provider
- [ ] Jellyfin provider implementation
- [ ] Local library provider (file system scanning)
- [ ] Provider-specific settings UI
- [ ] Unified library merging across multiple providers

## Testing
- [ ] Set up testing framework (Vitest or Jest)
- [ ] Unit tests: core engine, provider manager, models
- [ ] Unit tests: Zustand stores (player, playlist, auth, library)
- [ ] Integration tests: Navidrome provider API calls
- [ ] Integration tests: Telegram provider API calls
- [ ] Component tests: player, queue, search, onboarding
- [ ] E2E tests (Playwright): login flow, playback, search
- [ ] CI/CD pipeline (GitHub Actions)

## Desktop & Mobile
- [ ] PWA manifest + service worker
- [ ] Tauri desktop app wrapper
- [ ] Offline caching for played tracks
- [ ] Mobile gesture improvements (swipe, pull-to-refresh)

## Quality & Polish
- [ ] Make Navidrome server URL configurable (remove hardcoded IP)
- [ ] Environment variable setup (.env files for client & server)
- [ ] TypeScript migration
- [ ] Accessibility audit (WCAG compliance)
- [ ] Last.fm / ListenBrainz scrobbling
- [ ] Smart playlists (auto-generated based on rules)
- [ ] Social features (shared playlists, activity feed)
