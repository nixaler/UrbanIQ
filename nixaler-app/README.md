# niXaler

"Come as a cook, leave as a founder." A fixed-monthly-price bundle: LLC formation, tax-advantage guidance, a website, a CRM, a social media manager, and coaching.

This app is fully independent of the trivia game and Intellectus elsewhere in this repository — separate `package.json`, separate Supabase project, separate auth. See `/home/user/UrbanIQ/NIXALER_PLAN.md` at the repo root for the full architecture and phased roadmap.

## Setup

1. Create a new Supabase project (do not reuse the trivia game's or Intellectus's).
2. Copy `.env.example` to `.env.local` and fill in the Supabase, Postgres, and Stripe values.
3. Install dependencies:
   ```
   npm install
   ```
4. Generate and run migrations:
   ```
   npm run db:generate
   npm run db:migrate
   ```
5. Seed sample data (a demo coach, a demo client, and curriculum modules):
   ```
   npm run seed
   ```
6. Run the app:
   ```
   npm run dev
   ```
7. Sign in via the magic-link form at `/sign-in`. A fresh sign-up gets a `users` row and a starter `llc_formations` row automatically (`ensureUserProfile` in `src/lib/actions/auth.ts`, called from `/callback`).

## Notes for contributors

- All Postgres access goes through Drizzle (`src/lib/db/client.ts`), a raw TCP connection — routes that query the DB must stay on the Node.js runtime, not `edge`.
- LLC formation status (`llc_formations.status`) is advanced by staff, not by any automated filing integration — there is no live Secretary-of-State API call in V1. See the risk/scope notes in `NIXALER_PLAN.md`.
- The social content calendar (`content_posts`) is a real shared calendar between a client and their coach/manager, not live auto-posting to platform APIs — that is a scoped Phase 7 item per platform.
- Stripe webhooks (`src/app/api/webhooks/stripe/route.ts`) are the sole writer of `subscriptions.status` — never trust client-side state for plan/dashboard gating.
- The single fixed-price plan lives in `src/lib/config/plans.ts` — the dollar figure there is a placeholder pending a real pricing decision.
- Role model is `client` / `coach` / `admin` (`src/lib/auth/guards.ts`). Only `client`-facing dashboard pages are built in this pass; a coach/admin cross-client view is deferred (Phase 6 in `NIXALER_PLAN.md`).
