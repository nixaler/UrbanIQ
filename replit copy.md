# TheGuessingGame

A daily geography, transit & football puzzle app. Five games. Three rounds. One new challenge every day.

## Run & Operate

- `node server.js` — run the static file server (port 5000)
- `npm install` — install Express dependency

## Stack

- Node.js + Express (static file server)
- Single-page React app (CDN React 18 + Babel standalone)
- localStorage for all persistence (no backend/database)
- PWA: manifest.json + service worker

## Where things live

- `public/index.html` — the entire game (4200+ lines, React JSX via Babel)
- `public/manifest.json` — PWA manifest
- `public/sw.js` — service worker for offline support
- `server.js` — minimal Express static server

## Games

1. Portland MAX (PDX) — light rail stops, Pacific Northwest
2. DC Metro — subway stations, Nation's Capital
3. Baltimore MTA — light rail & metro, Maryland
4. US States — 50 states, regions & capitals
5. NFL Teams — 32 franchises, stats & history

## User preferences

- Light mode by default
- localStorage only — fresh leaderboard on load
- No backend, no tracking, always free
