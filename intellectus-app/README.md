# Intellectus

A daily news and topic reader built around "niche over noise": structured, depth-adjustable content paired with a discussion layer that rewards thoughtfulness over reflexive agreement.

This app is fully independent of the trivia game elsewhere in this repository — separate `package.json`, separate Supabase project, separate auth. See `/home/user/UrbanIQ/INTELLECTUS_PLAN.md` at the repo root for the full architecture and phased roadmap.

## Phase 0 setup

1. Create a new Supabase project (do not reuse the trivia game's).
2. Copy `.env.example` to `.env.local` and fill in the Supabase, Postgres, Anthropic, Inngest, and Stripe values.
3. Install dependencies:
   ```
   npm install
   ```
4. Generate and run migrations:
   ```
   npm run db:generate
   npm run db:migrate
   ```
5. Apply the RLS policies (not managed by Drizzle — run directly against Supabase):
   ```
   psql "$DATABASE_URL" -f drizzle/rls/001_core_policies.sql
   ```
6. Seed sample data:
   ```
   npm run seed
   ```
7. Run the app and the local Inngest dev server in parallel:
   ```
   npm run dev
   npx inngest-cli dev
   ```

## Notes for contributors

- All Postgres access goes through Drizzle (`src/lib/db/client.ts`), which uses a raw TCP connection — routes that query the DB must stay on the Node.js runtime, not `edge`. Edge hydration is a deliberate Phase 6 item once a fetch/HTTP-based driver is introduced.
- The AI text pipeline (`src/lib/ai/provider.ts`) is provider-agnostic; the default adapter is Claude (`src/lib/ai/providers/anthropic.ts`). Set `ANTHROPIC_MODEL` to a current model id.
- Shadow-banning relies on Postgres RLS (`drizzle/rls/001_core_policies.sql`), not just application-level filtering — this is what keeps Supabase Realtime's Postgres Changes stream from leaking shadow-banned comments to public subscribers.
- Predictive Staking and Micro-Tipping both involve real money and are meant to ship behind feature flags pending legal/regulatory review — see the risk note in `INTELLECTUS_PLAN.md`.
