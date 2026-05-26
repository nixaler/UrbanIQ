---
name: DiffPickerModal design
description: Difficulty picker is a centered modal with G.emoji and a Random button
---

DiffPickerModal is a centered overlay (justifyContent:"center", not "flex-end").
- Uses `G.emoji||"🗺️"` — never hardcoded gameKey checks.
- Animation: `dpIn` (scale+translateY) not `dpUp` (translateY only).
- Includes a 🎲 Random row at the bottom that picks a random key from G.diffConfig.

**Why:** Bottom sheet felt inconsistent with other modals; Random button reduces decision friction.
