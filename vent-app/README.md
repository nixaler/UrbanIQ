# vent-app

A structured peer-to-peer emotional-support app. A "Venter" picks a topic and
gets a strictly-timed 60-second vent; a matched "Listener" listens live, then
can send quick support, mutually agree to an open-ended extended call, or
follow the underlying issue.

This is a standalone Next.js app inside the UrbanIQ monorepo — it does not
share code, a database, or a Supabase/Stripe project with the sibling
`trivia game` (repo root) or `intellectus-app/` apps.

See `/root/.claude/plans/an-app-that-s-online-cached-russell.md` (or ask
Claude) for the full implementation plan and milestone breakdown.

## Setup

```bash
cd vent-app
npm install
cp .env.example .env.local   # fill in your own Supabase/Daily/Stripe project values
npm run db:push              # or db:generate + db:migrate
npm run seed                 # seeds the MVP topic categories
npm run dev
```

## Non-negotiables baked into this codebase

- **Not therapy, not a crisis service.** `ConsentGate` blocks all app
  functionality until this is acknowledged; `CrisisResourcesModal` is reachable
  from every core-loop screen.
- **The 60-second vent boundary is enforced server-side** (`ventStartedAt` set
  by the server, not the client) — never trust a client clock for this.
- **No leaderboards.** Listener engagement is gamified cooperatively (Empathy
  Garden, badges) — never as a ranked comparison between users.
- Anonymous-first identity (Supabase anonymous auth). Email is only ever
  collected if a user opts in to upgrade their account.
