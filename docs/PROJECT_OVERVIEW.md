# BinksConnect

### A personal cross-device music ecosystem with clean library management, lyrics, and seamless playback continuity

---

## 1. Project Vision

BinksConnect is a **personal-first, open-source music platform** built to provide a premium Spotify-like experience on top of a self-hosted music ecosystem.

The initial provider is **Navidrome**, but the architecture must remain **provider-agnostic** so future integrations can be added later.

The project is intended for:

* personal daily use
* open-source GitHub showcase
* portfolio project
* possible public hosting in the future

---

## 2. Core Motivation

Primary problems to solve:

* in-app lyrics without opening browser
* broken metadata and split albums
* cross-device playback consistency
* better playlist and album listening experience
* clean sorted library management

---

## 3. MVP Scope (Day 1)

Required Day 1 features:

* login with Navidrome
* stripped metadata system
* sorted albums
* stable music player
* playlists

---

## 4. Immediate Day 2 Scope

* lyrics integration
* source caching
* lyrics side panel

Potential provider:

* Genius

---

## 5. Flagship Identity

Primary differentiator:

* Spotify Connect–style device consistency
* playback continuity
* queue sync
* transfer playback

---

## 6. Final Technology Stack

### Frontend

* Next.js
* JavaScript
* Tailwind CSS
* Zustand

### Backend

* Node.js
* Express

### Database

* MongoDB

### Realtime

* WebSocket / Socket.IO

### Desktop

* Tauri

### Android

* Progressive Web App (PWA)

---

## 7. Development Strategy

The MVP will be built in JavaScript first for faster iteration and learning.

Migration to TypeScript may be done later after the application architecture stabilizes.

Primary development focus:

* functionality first
* modular architecture
* clean state management
* scalable provider system
