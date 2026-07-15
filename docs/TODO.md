fix plyalist cover, add option to directly add songs with one click. 
add login for various users. 
<!-- add dowload progress bar for current, and next in queue song. 

bug, pressed space and it continued a song while i played with mouse another song played. (2 songs together) -->
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
