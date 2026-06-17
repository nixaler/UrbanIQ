# UrbanIQ Product Rules

Plain-language source of truth for how the app works. Use this before prompting AI, reviewing PRs, or adding features.

---

## Users

| Type | How they exist | What they can do |
|------|---------------|-----------------|
| **Anonymous** | Device ID only (`tgg:did` in localStorage) | Play all games, submit scores, earn XP, collect cards |
| **Logged-in** | Email magic-link → 90-day JWT stored in `tgg:auth-token` | + Progress syncs to Supabase on login, cross-device recovery |
| **Supporter** | Logged-in + Stripe subscription paid | + Streak shields, shield badge in HUD |

A user can be anonymous forever. Login is optional but enables cross-device sync.

---

## Device ID

- Canonical key: `tgg:did` (generated with `crypto.randomUUID()`)
- Source: `getDeviceId()` in `src/main.tsx` — use this function everywhere, never inline
- Legacy key `tgg:device` exists on some old devices; read it as fallback only

---

## Onboarding

- Key: `has_boarded` (localStorage)
- Set to `"1"` when user completes or skips onboarding
- Never use `onboarding_complete` — that was a duplicate key, now removed

---

## XP Economy

- Earned per round won (50–200 XP depending on game + difficulty)
- **Daily cap: 400 XP** — enforced client-side via `tgg:xp:cap:YYYY-MM-DD`
- XP never decreases
- Sync rule: **take-max** (whichever is higher — client or Supabase — wins)
- Source of truth for local play: `tgg:xp` (localStorage)
- Source of truth after login: whichever is higher between local and `users.xp` in Supabase

---

## Streak

- Increments when user wins ≥ 1 round in a calendar day
- Breaks if a day is missed without a shield
- Sync rule: **server wins** (Supabase `users.streak` overrides local on login)
- Shield: Supporters only — consumes 1 shield to protect a missed day, max 3 held

---

## Shields

- Earned by Supporters (1 per month); also awarded at XP milestone 1500
- Stored: `tgg:shields` (localStorage) + Supabase `users.shields`
- Sync rule: **take-max**
- Shield usage tracked in `tgg:shield:YYYY-MM` (one shield per month per device)

---

## Supporter / Pro Status

**Source of truth: Supabase `users.pro_status` (boolean), written by server webhook only.**

Flow:
1. User completes Stripe checkout → `checkout.session.completed` webhook fires → server sets `users.pro_status = true` for that email
2. User cancels → `customer.subscription.deleted` webhook → server sets `users.pro_status = false`
3. Client reflects this on next login via `/api/me` → writes `supporter_email` + `tgg:global.proStatus` to localStorage

**Never trust:** `?supporter=1` URL param alone (it's now also handled, but it's not cryptographically verified — only use it to hint the UI, not grant permanent access). Real enforcement requires a logged-in JWT and `pro_status: true` from Supabase.

**Required env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## Daily Puzzles

- 3 rounds per day, per game type
- Seed: `_dayTargets(items, getDayNum(), gameKey)` — deterministic Fisher-Yates from day + game key
- Same answer worldwide, every day, purely client-side clock (midnight local)
- No server-side enforcement of "already played today"
- `getDayNum()` = floor(Date.now() / 86400000) — days since Unix epoch

---

## Score Submission

- Endpoint: `POST /api/scores` (no auth required — anonymous ok)
- Validations (server-side):
  - `dayNum` must be today ± 1 day
  - `wins` must be 0–3, `totalGuesses` must be 0–18
  - Max 6 submissions per `deviceId` per calendar day
  - Global rate limit: 20 req/min per IP
- Leaderboard is public (anyone can read it)

---

## Card Collection

- Cards earned by winning rounds; opened in daily free packs
- Stored **in localStorage only** (`tgg-card-col`) — no server backup yet
- PvP battle deck: up to 5 cards (`tgg-card-deck`)
- Card redemption (physical card QR): `POST /api/redeem-card`, tied to deviceId, one redemption per code

---

## localStorage Key Reference

| Key | What it stores | Source of truth? |
|-----|---------------|-----------------|
| `tgg:did` | Device ID (UUID) | Local only |
| `tgg:xp` | Lifetime XP total | take-max with Supabase |
| `tgg:xp:cap:YYYY-MM-DD` | XP earned today (for 400 cap) | Local only |
| `tgg:global` | `{streak, lastWin, proStatus}` | Supabase wins on streak |
| `tgg:shields` | Shield count | take-max with Supabase |
| `tgg:shield:YYYY-MM` | Shield used this month? | Local only |
| `tgg:auth-token` | JWT (90-day) | Local only |
| `tgg:server-profile` | Cached `/api/me` response | Server is authoritative |
| `supporter_email` | Email of paying Supporter | Derived from Supabase pro_status |
| `has_boarded` | Onboarding completed | Local only |
| `tgg:cityPref` | Last selected game key | Local only |
| `tgg:diff` | Last selected difficulty | Local only |
| `tgg-card-col` | Card collection | Local only (no server backup) |
| `tgg-card-deck` | Battle deck | Local only |
| `tgg:quests:done` | Completed quest IDs | Local only |
| `tgg:story:*` | Story chapter progress | Local only |
| `tgg:legends-unlocked` | Unlocked legend card IDs | Local only |

---

## What Lives Where (Summary)

```
Supabase (server-authoritative):
  users.xp              ← take-max with local
  users.streak          ← server wins
  users.shields         ← take-max with local  
  users.pro_status      ← written ONLY by Stripe webhook
  leaderboard           ← score submissions
  friendships           ← social graph

localStorage (local-first):
  Everything else — game history, cards, preferences, onboarding state
  Card collection and deck have no server backup (single device)
```
