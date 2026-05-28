---
name: NYC/Chi games wiring
description: All state objects that key by game must include la/nyc/chi or runtime TypeError occurs on first load
---

All of these state objects must include la, nyc, chi keys alongside pdx/dc/states/nfl/balt:
- `allStats` (Root + GameApp useState initial value)
- `roundData` (Root + GameApp useState initial value AND quickRound construction)
- `blitzBests` (Root + GameApp useState initial value AND setBlitzBests call)
- `playHistory`, `dailyPoints`, `allUnlocked` (GameApp state)

GameSelector reads `roundData[g.key]` — add `||[{won:false,alreadyPlayed:false}×3]` fallback for safety.

**Why:** Missing keys cause `roundData[gameKey]` to be undefined, crashing `.findIndex()` and `.filter()` calls in GameApp and GameSelector on first load before localStorage is populated.

**How to apply:** Any time a new game key is added, update every state initializer and every Promise.all loader in both Root and GameApp useEffects.
