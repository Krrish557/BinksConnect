# Telegram Integration Architecture (BinksConnect)

> Version: 1.0 Purpose: Design document for using Telegram as a storage
> provider in BinksConnect.

------------------------------------------------------------------------

# Goal

Telegram is **not** the music platform.

Telegram is only a **storage provider**.

BinksConnect is responsible for:

-   Authentication
-   Authorization
-   Metadata
-   Streaming
-   Search
-   Playlists
-   Favorites
-   History
-   Caching
-   Provider selection

Users never communicate with Telegram directly.

------------------------------------------------------------------------

# High-Level Architecture

``` text
Client
   │
   ▼
Express Backend
   │
   ▼
Provider Manager
   │
   ▼
Telegram Provider
   │
   ▼
Telegram Storage Bot
   │
   ▼
Multiple Private Telegram Channels
```

SQLite is the source of truth for every piece of metadata.

------------------------------------------------------------------------

# Core Principles

1.  Telegram is object storage only.
2.  SQLite is the database of record.
3.  Client never knows Telegram exists.
4.  Every request passes through the backend.
5.  Aggressive RAM + disk caching.
6.  Stream while downloading.
7.  Provider-agnostic architecture.

------------------------------------------------------------------------

# Storage Strategy

One Telegram Bot.

Multiple private channels.

Example:

``` text
Storage-01
Storage-02
Storage-03
Storage-04
```

The bot decides where new uploads go.

Possible strategies:

-   Round robin
-   Lowest storage usage
-   Lowest file count
-   Manual assignment

SQLite stores:

-   Track ID
-   Channel ID
-   Message ID
-   File ID
-   File Unique ID
-   Size
-   SHA-256 checksum
-   Encryption status

------------------------------------------------------------------------

# Upload Flow

1.  User imports music.
2.  Backend extracts metadata.
3.  Generate internal Track ID.
4.  Compute checksum.
5.  Optional encryption (AES-256-GCM).
6.  Choose destination channel.
7.  Bot uploads file as Telegram Document.
8.  Receive Telegram IDs.
9.  Store mapping in SQLite.

------------------------------------------------------------------------

# Playback Flow

Client requests:

GET /api/stream/:trackId

Backend:

1.  Verify JWT.
2.  Resolve Track ID in SQLite.
3.  Check RAM cache.
4.  Check SSD cache.
5.  Download from Telegram on cache miss.
6.  Stream immediately while downloading.
7.  Save to SSD cache.
8.  Future requests come from cache.

------------------------------------------------------------------------

# Cache Hierarchy

L1: - RAM - Frequently accessed songs

L2: - SSD - Recently downloaded songs

L3: - Telegram - Permanent storage

Priority:

RAM → SSD → Telegram

------------------------------------------------------------------------

# Telegram Bot Responsibilities

The bot only performs storage operations.

It: - Uploads music - Downloads music - Deletes files - Verifies
storage - Repairs missing mappings (future) - Reports storage statistics

It does NOT: - Authenticate users - Manage playlists - Handle
permissions - Stream directly to clients

------------------------------------------------------------------------

# Authentication

Users never log into Telegram.

Users authenticate against BinksConnect.

Flow:

Register/Login

↓

JWT

↓

Authorization Header

↓

Backend

↓

Provider

Telegram only trusts the backend.

------------------------------------------------------------------------

# Security

Never expose:

-   Channel IDs
-   Message IDs
-   File IDs
-   Bot Token

Frontend only receives internal Track IDs.

Recommended:

-   JWT authentication
-   Signed stream URLs
-   Rate limiting
-   Optional encryption before upload

------------------------------------------------------------------------

# Database

Suggested tables:

Tracks Artists Albums Users Playlists Favorites History TelegramFiles
Cache

TelegramFiles stores only provider mappings.

------------------------------------------------------------------------

# Error Recovery

If Telegram download fails:

1.  Retry
2.  Retry with exponential backoff
3.  Switch to another worker
4.  Return graceful error

Future:

-   Automatic verification jobs
-   Missing file detection
-   Re-upload from backup

------------------------------------------------------------------------

# Future Scaling

Provider Manager should support:

-   Telegram
-   Navidrome
-   S3
-   Google Drive
-   Dropbox
-   Local Storage

All providers expose the same interface.

------------------------------------------------------------------------

# Why This Design?

Advantages:

-   Client is storage-agnostic.
-   Easy to add new providers.
-   Fast playback through caching.
-   Clean separation of concerns.
-   Suitable for demonstrating backend architecture.

Trade-offs:

-   Telegram remains a dependency.
-   Copyright considerations apply if distributing copyrighted content.
-   Telegram should not be the only backup location.

------------------------------------------------------------------------

# Recommended Implementation Priority

## Phase 1 (Highest Priority)

-   Provider interface
-   Telegram Provider
-   SQLite schema
-   Upload pipeline
-   Download pipeline
-   Internal Track IDs

## Phase 2

-   RAM cache
-   SSD cache
-   Stream while downloading
-   Queue workers

## Phase 3

-   Background prefetching
-   Retry logic
-   Health monitoring
-   Structured logging

## Phase 4

-   Encryption
-   Signed stream URLs
-   Rate limiting
-   Metrics

## Phase 5

-   Multiple provider support
-   Automatic storage balancing
-   Background verification
-   Backup/restore

------------------------------------------------------------------------

# Resume Positioning

Present BinksConnect as:

> A provider-agnostic personal media server that abstracts multiple
> storage backends behind a unified streaming API. It features secure
> authentication, metadata indexing, intelligent caching, background
> workers, and pluggable storage providers. Telegram is implemented as
> one storage backend rather than being the core application.

------------------------------------------------------------------------

# Internal Domain Model (NEW - Critical)

## Philosophy

The client, stores, services, and UI must never depend on
provider-specific identifiers. Every entity uses a permanent internal
BinksConnect ID.

Example flow:

Client → track_00001234 → Provider Manager → Telegram → Channel ID +
Message ID

Internal IDs: - track_00000001 - album_00000001 - artist_00000001 -
playlist_00000001

These IDs never change even if the storage provider changes.

------------------------------------------------------------------------

# Canonical Domain Models

Every provider must normalize its data into common models.

Navidrome Track → Normalizer → BinksTrack

Telegram Track → Normalizer → BinksTrack

The frontend only understands BinksTrack.

Suggested fields:

-   id
-   provider
-   providerTrackId
-   title
-   artist
-   album
-   duration
-   bitrate
-   artworkId
-   streamable

------------------------------------------------------------------------

# Provider Mapping Layer

SQLite should separate business entities from provider mappings.

Tracks: - track_id - title - artist_id - album_id - duration -
provider_id

ProviderMappings: - track_id - provider - provider_track_id -
telegram_channel_id - telegram_message_id - telegram_file_id -
telegram_file_unique_id

Changing providers only updates ProviderMappings.

------------------------------------------------------------------------

# Provider Registry

ProviderManager should resolve providers through a registry/factory
rather than constructing providers directly.

ProviderManager → ProviderRegistry → TelegramProvider →
NavidromeProvider → Future Providers

------------------------------------------------------------------------

# Updated Upload Flow

1.  Read metadata.
2.  Generate internal Track ID.
3.  Calculate checksum.
4.  Optional encryption.
5.  Select Telegram storage channel.
6.  Upload.
7.  Receive Telegram IDs.
8.  Store provider mapping.
9.  Return internal Track ID.

------------------------------------------------------------------------

# Updated Playback Flow

Client → GET /api/stream/track_00001234 → JWT → ProviderMappings lookup
→ Resolve provider → RAM cache → SSD cache → Telegram download (cache
miss) → Stream to client

No Telegram identifiers leave the backend.
