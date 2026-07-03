# Intellectus — Product & Technical Plan

## Context

Intellectus is a daily news and topic reader built around "niche over noise": structured, depth-adjustable content paired with a discussion layer explicitly engineered to reward thoughtfulness over reflexive agreement. It rejects the toxic, knee-jerk-reaction model of algorithmic news feeds and traditional comment sections in favor of read-gated, two-dimensionally-scored, civil discourse.

It is a brand-new, fully independent app living inside the `UrbanIQ` git repo (which otherwise contains an unrelated daily trivia/puzzle game — Vite+React+Express+Supabase). Intellectus shares nothing with that codebase: no reused package.json, server, database project, or auth. The two apps coexist only at the repo/branch level.

## Confirmed product decisions

| Question | Decision |
|---|---|
| Content niche | General daily news (not locked to a vertical) |
| Editorial team | Solo — you are the sole human editor at launch |
| Daily content volume | Multiple parallel topic tracks per day |
| Launch audience | Public open signup, no invite gate |
| Total daily reading load | ~30 minutes across all tracks/depths combined |
| Depth tiers (Summary/Standard/Deep-Dive) | All free to read — no tier is paywalled |
| Monetization timing | Free at launch; paywalls (discussion rooms, weekend vault) added later |
| Live Audio Huddles | Deferred past initial launch — text discussion carries the community first |
| Predictive Staking | Real money eventually (flagged — see Risks) |
| Micro-Tipping | Real money via Stripe Connect (flagged — see Risks) |
| Narration voice | Synthetic AI voice, not a real/cloned human voice |
| Sponsorships | Speculative for now, not an early priority |
| Moderation | Fully automated from day one, no human review queue |
| Compliance target | None specific (GDPR/CCPA) yet |
| Branding | Invented from scratch during the visual-design pass |
| Timeline | No hard launch deadline |

### Risk flag: real-money staking + tipping

Predictive Staking (real-world outcome bets) and Micro-Tipping (Stripe Connect payouts) both involve real money changing hands, with no compliance target defined yet. Staking on real-world outcomes for cash can trigger gambling-law definitions in some jurisdictions; Stripe Connect payouts bring KYC obligations. Recommendation: build both as isolated modules behind feature flags so the rest of the platform can ship and prove itself while the legal/regulatory side of these two features is resolved separately.

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | RSC + Server Actions, per-route edge runtime — needed for edge-cached hydration (#29) |
| DB + Auth | Supabase (own project, separate from the trivia game's) | Bundles Postgres + RLS, Auth, Realtime (Postgres Changes/Presence), and Storage — covers live comments, huddle presence, and media storage without bolting on separate services |
| ORM | Drizzle | No query-engine binary to bundle — runs cleanly in Vercel Edge Functions, unlike Prisma's paid Accelerate/Data Proxy edge story |
| Styling | Tailwind CSS v4 + CSS custom-property design tokens | Single source of truth for the calming/"chill" palette and dark mode, switched via `next-themes` |
| State/data | RSC + Server Actions for mutations, TanStack Query for interactive client state, Zustand for small ephemeral UI state (depth preference, audio position, bubble-pop mode) | Avoids client waterfalls; keeps voting/comment optimistic updates simple |
| AI text pipeline | Provider-agnostic service interface (`lib/ai/provider.ts`), swappable adapters | Single point of control for atomic-block drafting, discussion prompts, digest summarization |
| AI narration/TTS | Separate provider-agnostic interface (`lib/ai/tts/provider.ts`) | Decoupled from text generation — different latency/cost/licensing profile |
| Realtime | Supabase Realtime for comment streams, vote counts, presence | Native RLS-based channel authorization keyed to Supabase JWTs |
| Audio infra (huddles, deferred) | LiveKit (SFU) for actual audio transport when built | Supabase Realtime alone can't carry many-to-many audio |
| Jobs/scheduling | Inngest (durable step functions) + Vercel Cron for time-based kickoff | Per-user "Intel Window" notification times need `step.sleepUntil` fan-out; Inngest gives retries for the multi-step AI content pipeline |
| PWA/offline | Serwist (maintained Workbox successor for App Router) + IndexedDB (Dexie/idb-keyval) | Powers local-first daily-stack caching and the zero-data privacy tier |
| Rate limiting / counters | Upstash Redis | Shadow-ban counters, Devil's-Advocate daily-use limits, per-IP submission caps |
| Payments | Stripe (+ Stripe Connect for tipping payouts) | Subscriptions, weekend vault, tipping |

## 2. Directory layout

```
/home/user/UrbanIQ/intellectus-app/          # fully separate from the trivia game
  package.json / next.config.mjs / tsconfig.json
  tailwind.config.ts / drizzle.config.ts
  public/ (manifest.json, sw.js)
  src/
    app/
      (reader)/page.tsx, topics/[topicSlug]/page.tsx, article/[articleId]/page.tsx
      (reader)/article/[articleId]/discussion/
      (auth)/sign-in/, sign-up/, callback/
      (account)/settings/notifications/, settings/privacy/, settings/subscription/
      (guilds)/guilds/[guildId]/
      (predictions)/predictions/
      admin/content-pipeline/, moderation-queue/, sponsors/
      api/comments/, votes/, huddles/, huddles/token/, predictions/stake/, tips/,
          webhooks/stripe/, cron/digest/, cron/streak-reset/, inngest/, ai/generate-stack/
    components/
      reading/ (ArticleShell, ContentBlock, DepthToggle, ReadProgressGate, MicroPoll, TimeMachineTooltip)
      discussion/ (CommentThread, CommentComposer, TwoDimVoteButtons, DevilsAdvocateToggle,
                    AgreeToDisagreeButton, DiscussionPromptCard)
      huddles/ (HuddleCard, HuddleRoom, ParticipantList)   # deferred implementation
      badges/, guilds/, predictions/, layout/, ui/
    lib/
      db/schema/ (users, content, discussion, gamification, monetization, moderation)
      supabase/ (server, browser, realtimeChannels)
      auth/ (session, guards)
      ai/ (provider.ts, providers/*, tts/provider.ts, tts/providers/*,
           pipelines/buildDailyStack.ts, generateDiscussionPrompts.ts, generateDigest.ts, narrateArticle.ts)
      moderation/ (reputationEngine.ts, shadowBan.ts, flagQueue.ts)
      gamification/ (streakEngine.ts, guildMultiplier.ts, predictionSettlement.ts)
      realtime/ (livekitTokens.ts, huddleLifecycle.ts)
      offline/ (serwist.config.ts, dailyStackCache.ts)
      seo/ (jsonLdBuilders.ts)
      inngest/ (client.ts, functions/dailyDigest.ts, streakReset.ts, notificationDispatch.ts, contentPipeline.ts)
    hooks/ (useReadingProgress, useRealtimeComments, useDepthPreference, useAudioSync)
    styles/ (tokens.css, globals.css)
  drizzle/          # generated SQL migrations
  scripts/ (seed.ts, generateSampleStack.ts)
  tests/ (unit/, integration/, e2e/)
```

## 3. Core schema (by domain)

**Identity & reputation**: `users`, `reputation_events`, `badges`/`user_badges`.

**Content**: `topics`/`tracks` (with `sponsor_id`), `articles` (daily stacks, `human_editor_id`, `is_premium_archive`), `content_blocks` (article_id, `block_type` enum(event/backstory/visual_data/global_impact/primary_source), `depth_level` enum(summary/standard/deep), body jsonb), `perspectives`, `provenance_records` (C2PA), `narrations`.

**Discussion & moderation**: `discussion_prompts`, `comments` (parent_id, is_anonymous, is_shadow_banned, thread_status), `comment_votes` (vote_type enum(well_researched/agree)), `micro_poll_responses`, `moderation_flags`, `huddles`/`huddle_participants` (schema scaffolded now, wiring deferred).

**Reading progress & gamification**: `reading_progress` (scroll_pct, time_spent_seconds, unlocked_comments), `user_streaks`, `guilds`/`guild_members`/`guild_streaks`, `predictions`/`prediction_stakes`, `knowledge_points` ledger.

**Notifications, monetization, privacy**: `notification_prefs` (intel_window_time), `subscriptions`, `tips` (Stripe Connect), `sponsors`, `feed_reset_events`, `privacy_settings` (zero_data_mode).

### Key structural decisions

- **`content_blocks` is the single join point between the Atomic Object framework and Depth Toggles.** Each row has both `block_type` and `depth_level`; toggling depth swaps which rows render within the *same* article structure — it does not switch articles. This means the AI pipeline generates ~12-15 block variants per article (3 depths × 4-5 block types), a real cost multiplier worth tracking.
- **`reputation_events` is the single ledger** read/written by two-dimensional voting, badge computation, Devil's-Advocate eligibility, and shadow-banning — one source of truth, four consumers.
- Anonymous Devil's-Advocate comments still carry a hidden `user_id` for moderation traceability despite being displayed anonymously.
- Shadow-banned comments are filtered from public queries but visible to their own author (`viewer_id === comment.user_id` bypass) so the ban stays invisible to the banned user.
- Stripe webhooks are the sole source of subscription-tier truth — never trust client-side state for paywall gating.

## 4. Phased roadmap

| Phase | Features covered | Status vs. decisions |
|---|---|---|
| **0 — Foundation** | Schema, auth, RLS, Tailwind tokens, dark mode groundwork, Inngest/Upstash wiring | Next up |
| **1 — Core reading** | #8 Atomic Objects, #12 Depth Toggle, #9 Multi-Perspective, #10 Human editor badging, #11 Time-machine links, #17/#18 dark mode + chill aesthetic, #28 AEO schema markup | All free, ~30 min/day total budget |
| **2 — Discussion layer** | #1 Read-to-Unlock, #2 Discussion Prompts, #3 2D Voting, #4 Badges, #5 Devil's Advocate, #7 Agree-to-Disagree | #6 Huddles schema scaffolded only, wiring deferred |
| **3 — Retention** | #13 Guild streaks, #14 Predictive Staking, #15 Weekend Vault, #16 Notification windows | Staking built behind a feature flag pending real-money legal review |
| **4 — Monetization** | #21 Sponsorships, #22 Premium discussion rooms, #23 Micro-Tipping | Paywall flag off at launch; tipping behind a feature flag pending Stripe Connect KYC setup |
| **5 — Safety/governance** | #24 C2PA, #25 Bubble reset, #26 Shadow-banning, #27 Zero-data mode | Moderation fully automated, no human review queue |
| **6 — Technical polish** | #19 Ambient audio (synthetic voice), #20 Inline micro-polls, #29 Edge hydration, #30 Local-first caching | — |

## 5. Verification approach (per phase)

1. `scripts/seed.ts` extended each phase with that phase's new entities.
2. Local dev loop: `supabase start` (local Postgres/Auth/Realtime) + `npx inngest-cli dev` + `npm run dev`.
3. Manual click-through checklist per phase, plus targeted automated tests for logic-heavy pieces:
   - **Phase 0**: migrations apply cleanly; RLS blocks logged-out reads of `moderation_flags`.
   - **Phase 1**: depth toggle swaps content without refetch; dark-mode contrast passes; JSON-LD shape validated.
   - **Phase 2**: unit tests for read-to-unlock threshold math, vote-dimension isolation, Devil's-Advocate daily-limit enforcement; manual Agree-to-Disagree mutual-lock check.
   - **Phase 3**: automated test that one missing guild member drops the whole guild's multiplier; prediction settlement math has no negative balances.
   - **Phase 4**: Stripe test-mode checkout flips `subscriptions.status` only via webhook; discussion room stays locked without an active sub while reading remains free.
   - **Phase 5**: shadow-banned comment invisible to others but visible to its author; zero-data mode writes zero server-side rows for a full session.
   - **Phase 6**: airplane-mode test confirms today's stack renders from IndexedDB; edge-runtime route latency check.

## Critical files (Phase 0 starting points)

- `/home/user/UrbanIQ/intellectus-app/src/lib/db/schema/content.ts`
- `/home/user/UrbanIQ/intellectus-app/src/lib/ai/provider.ts`
- `/home/user/UrbanIQ/intellectus-app/src/lib/moderation/reputationEngine.ts`
- `/home/user/UrbanIQ/intellectus-app/src/lib/inngest/functions/contentPipeline.ts`
- `/home/user/UrbanIQ/intellectus-app/src/app/article/[articleId]/page.tsx`
