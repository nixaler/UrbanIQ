---
name: PeekModal two-step design
description: Peek feature uses a standalone PeekModal component with warning-first, then map-reveal flow
---

Peek is implemented as a standalone `PeekModal` component (defined before BetaModal).

Flow:
1. First render (confirmed=false): Show warning card with cost in guesses, CANCEL and "USE PEEK (−N)" buttons. No map shown yet.
2. After user clicks USE PEEK: setConfirmed(true) → shows the full map schematic with pulsing station marker.
3. onConfirm callback deducts the penalty (updateRound peekPenalty) and closes.

**Why:** Deducting before the user sees the map = unexpected penalty. Two-step lets user consciously accept the cost before the reveal.

**How to apply:** The IIFE in GameApp JSX calls `<PeekModal ... onConfirm={()=>{deduct; close;}} />`. The penalty is deducted in onConfirm, not on modal open.
