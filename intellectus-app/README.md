# Intellectus

A daily news and topic reader built around "niche over noise": structured, depth-adjustable content paired with a discussion layer that rewards thoughtfulness over reflexive agreement.

This app is fully independent of the trivia game elsewhere in this repository — separate `package.json`, separate Supabase project, separate auth. See `/home/user/UrbanIQ/INTELLECTUS_PLAN.md` at the repo root for the full architecture and phased roadmap.

## Setup

1. Create a new Supabase project (do not reuse the trivia game's).
2. Copy `.env.example` to `.env.local` and fill in the Supabase, Postgres, Anthropic, Inngest, Stripe, and ElevenLabs values.
3. In the Supabase dashboard, create a public Storage bucket named `narrations` (used by the ambient audio pipeline, `src/lib/ai/tts/providers/elevenlabs.ts`).
4. Install dependencies:
   ```
   npm install
   ```
5. Generate and run migrations:
   ```
   npm run db:generate
   npm run db:migrate
   ```
6. Apply the RLS policies (not managed by Drizzle — run directly against Supabase):
   ```
   psql "$DATABASE_URL" -f drizzle/rls/001_core_policies.sql
   ```
7. Seed sample data:
   ```
   npm run seed
   ```
8. Run the app and the local Inngest dev server in parallel:
   ```
   npm run dev
   npx inngest-cli dev
   ```
9. Sign in via the magic-link form at `/sign-in`; a fresh Supabase Auth user has no row in the app's `users` table until one is created (the seed script creates two sample users, but real sign-ups need a trigger or onboarding step to insert one — not yet wired).

## Notes for contributors

- All Postgres access goes through Drizzle (`src/lib/db/client.ts`), which uses a raw TCP connection — routes that query the DB must stay on the Node.js runtime, not `edge`. Rather than force a broken edge+driver combo, cacheable article data is served through `src/lib/db/queries/articleBaseData.ts` (`unstable_cache` + per-article tag, invalidated by `publishArticle()` in `src/lib/actions/articles.ts`).
- The AI text pipeline (`src/lib/ai/provider.ts`) is provider-agnostic; the default adapter is Claude (`src/lib/ai/providers/anthropic.ts`). Set `ANTHROPIC_MODEL` to a current model id. Narration TTS (`src/lib/ai/tts/provider.ts`) is a separate provider-agnostic interface, defaulting to ElevenLabs with a synthetic voice.
- Shadow-banning relies on Postgres RLS (`drizzle/rls/001_core_policies.sql`), not just application-level filtering — this is what keeps Supabase Realtime's Postgres Changes stream from leaking shadow-banned comments to public subscribers.
- Predictive Staking settles in virtual Knowledge Points only for now; Micro-Tipping is wired for real money via Stripe Connect but gated behind `NEXT_PUBLIC_TIPPING_ENABLED` pending Connect account onboarding/KYC. Both are flagged in `src/lib/config/featureFlags.ts` — see the risk note in `INTELLECTUS_PLAN.md`.
- Page-level auth uses `requireUserForPage`/`requireRoleForPage` (redirect to `/sign-in`), while Server Actions use `requireUser`/`requireRole` (throw, caught by the calling component) — see the comment in `src/lib/auth/guards.ts` for why they're not unified.
- The service worker (`src/app/sw.ts`) is disabled in development on purpose (see `next.config.mjs`) so HMR isn't cached; it only builds in production.
