# niXaler — Product & Technical Plan

## Context

niXaler is a "come as a cook, leave as a founder" business-in-a-box service. Prospective creators, business owners, entrepreneurs, and self-employed people sign up for a single fixed monthly plan and get: an LLC formed on their behalf (with tax-advantage guidance), a website, a CRM to manage their own customers, a social media manager/content calendar, and ongoing 1:1 coaching + a self-serve curriculum — the operational backbone of a real business, without them having to assemble it themselves.

It is a brand-new, fully independent app living inside the `UrbanIQ` git repo (which otherwise contains an unrelated daily trivia/puzzle game, and a separate news-reader app, Intellectus). niXaler shares nothing with either: no reused package.json, server, database project, or auth. All three apps coexist only at the repo/branch level.

The niXaler brand family already has a documented visual identity from an earlier project (niXalergame — a creative-technology/games brand: white base, black/silver/soft electric blue accents, premium-minimal, sci-fi-restrained, geometric-with-rounded-corners, modern condensed sans-serif). This app reuses that same visual language for brand consistency across the niXaler LLC family, with new copy and information architecture built around the business-services offer rather than games.

## Confirmed product decisions

| Question | Decision |
|---|---|
| V1 scope | Full platform: marketing site **and** a working client dashboard with real CRM, social content calendar, and coaching tooling — not just a brochure site |
| App structure | New isolated Next.js app (`nixaler-app/`), same pattern as `intellectus-app/` — own package.json, own Supabase project, own auth |
| "Life coach" framing | Real coaching component: session booking requests, a self-serve curriculum (modules with progress tracking), not just marketing tone |
| LLC formation | Tracked as a status pipeline in-app (not_started → info_submitted → filed → ein_issued → complete) with document uploads; no live state-filing API integration in V1 — an admin/ops user advances status as the filing is actually completed. Building a real Secretary-of-State API integration is a later phase per state. |
| Social media manager | V1 is a real content calendar (draft/scheduled/posted posts per platform) the client and their assigned manager both edit — no live auto-posting to third-party platform APIs yet (that's a Phase 3+ integration item, one OAuth/API per platform). |
| Pricing | Single fixed monthly plan by default (placeholder: **$497/mo**, editable in `lib/config/plans.ts`), with room for a second annual-discount tier later. Real dollar figure is a business decision — treat the placeholder as a stand-in, not a committed price. |
| Payments | Stripe Subscriptions, webhook-driven status (same pattern as Intellectus — never trust client-side state for plan gating) |
| Roles | `client`, `coach` (staff who run coaching sessions + manage a client's social calendar/CRM on their behalf), `admin` |
| Compliance | None specific yet. Flag: niXaler is not a law firm or CPA — all LLC/tax copy must read as guidance/facilitation, not legal or tax advice, until real counsel reviews the copy. |

## 1. Stack

Deliberately identical to Intellectus's stack choices, for the same reasons (see `INTELLECTUS_PLAN.md`) and so the two Next.js apps in this repo stay consistent to maintain:

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| DB + Auth | Supabase (own project — Postgres + Auth + Storage for LLC document uploads) |
| ORM | Drizzle |
| Styling | Tailwind CSS v3 + CSS custom-property design tokens (niXaler palette), dark mode via `next-themes` |
| State/data | Server Actions for mutations, RSC for reads; Zustand only if a client-only UI need shows up (none yet) |
| Payments | Stripe Subscriptions + webhooks |
| PWA/offline | Not needed for V1 (this is a business dashboard, not a daily-habit app like the other two) — skipped to keep scope honest |

## 2. Directory layout

```
/home/user/UrbanIQ/nixaler-app/          # fully separate from the trivia game and Intellectus
  package.json / next.config.mjs / tsconfig.json / tailwind.config.ts / drizzle.config.ts
  public/
  src/
    app/
      (marketing)/page.tsx, pricing/page.tsx
      (auth)/sign-in/page.tsx, (auth)/callback/route.ts
      dashboard/page.tsx                       # overview
      dashboard/onboarding/page.tsx             # LLC formation stepper
      dashboard/crm/page.tsx                    # contacts
      dashboard/social/page.tsx                 # content calendar
      dashboard/coaching/page.tsx               # curriculum + session booking
      admin/clients/page.tsx                    # coach/admin view across all clients
      api/webhooks/stripe/route.ts
    components/
      marketing/ (Hero, OfferBundle, PricingCard, FaqAccordion, MarketingFooter)
      layout/ (NavBar, DashboardNav, MagicLinkForm)
      onboarding/ (LlcStepper, DocumentUploadForm)
      crm/ (ContactList, ContactForm, StageBadge)
      social/ (PostCalendar, PostForm, StatusBadge)
      coaching/ (ModuleList, SessionRequestForm)
    lib/
      db/schema/ (users, onboarding, crm, social, coaching, monetization, index)
      db/client.ts
      supabase/ (server, browser)
      auth/ (session, guards)
      actions/ (auth, onboarding, crm, social, coaching, subscriptions)
      config/ (plans.ts)
      stripe/client.ts
    styles/ (tokens.css, globals.css)
  drizzle/          # generated SQL migrations
```

## 3. Core schema (by domain)

**Identity**: `users` (id mirrors Supabase Auth uid, `role` enum(client/coach/admin), `businessName`, `assignedCoachId`).

**Onboarding / LLC formation**: `llc_formations` (owner_id, business_name, formation_state, entity_type, status enum(not_started/info_submitted/filed/ein_issued/complete), ein, filed_at, notes), `onboarding_documents` (formation_id, file_url, label, uploaded_at).

**CRM**: `crm_contacts` (owner_id — the *client's* own end customer, name, email, phone, company, stage enum(lead/qualified/customer/churned), notes), `crm_tasks` (contact_id, title, due_at, done boolean).

**Social media manager**: `social_accounts` (owner_id, platform, handle), `content_posts` (owner_id, platform, caption, media_url, status enum(draft/scheduled/posted), scheduled_at, created_by — client or their coach).

**Coaching**: `curriculum_modules` (title, description, order, resource_url), `module_progress` (user_id, module_id, completed_at), `coaching_sessions` (client_id, coach_id, requested_at, scheduled_at, status enum(requested/scheduled/completed/canceled), notes).

**Monetization**: `subscriptions` (user_id, stripe_customer_id, stripe_subscription_id, plan_id, status), mirrors Intellectus's "Stripe webhook is sole source of truth" rule.

### Key structural decisions

- **`llc_formations.status` is the backbone of the onboarding dashboard** — every other dashboard section (CRM, social, coaching) stays visible regardless of formation status, since a client's business coaching value shouldn't be gated behind paperwork completing first.
- **`crm_contacts.owner_id` and `content_posts.owner_id` both point at the *client* user**, not at niXaler staff — these are the client's own business data. `coaching_sessions` is the only table where a `coach_id` (niXaler staff) is a first-class party.
- Stripe webhooks are the sole source of subscription-tier truth — the dashboard nav gates on `subscriptions.status === 'active'`, never on client-side state, matching the rule already established in Intellectus.
- No live third-party platform posting (Instagram/TikTok/etc. APIs) or live Secretary-of-State filing API in V1 — both are real per-integration projects flagged for a later phase, not stubbed with fake automation that would mislead a paying client about what's actually happening.

## 4. Phased roadmap

| Phase | Features covered | Status |
|---|---|---|
| **0 — Foundation** | Schema, auth, RLS, Tailwind tokens (niXaler palette), Stripe client, feature flags | This session |
| **1 — Marketing site** | Hero/offer breakdown/pricing/FAQ, signup → Stripe Checkout | This session |
| **2 — Client dashboard core** | Auth-gated dashboard shell, LLC onboarding stepper with document upload, dashboard nav | This session |
| **3 — CRM** | Contact list + add/edit + stage pipeline, basic tasks | This session |
| **4 — Social content calendar** | Post list + add/schedule + status, per-platform grouping | This session |
| **5 — Coaching** | Curriculum modules + progress tracking, session request/booking | This session |
| **6 — Staff/admin tooling** | Coach view across assigned clients, admin LLC-status updates, document review | Deferred — needs role-based dashboard split, flagged for next session |
| **7 — Real integrations** | Live social platform posting (per-platform OAuth), live Secretary-of-State filing status APIs (per-state), Stripe Connect if niXaler ever pays out sub-contracted coaches | Deferred — each is its own scoped integration project with real compliance review |

## 5. Verification approach (per phase)

1. `scripts/seed.ts` extended each phase with that phase's new entities (a demo client, a demo coach, sample contacts/posts/modules).
2. Local dev loop: `supabase start` (local Postgres/Auth) + `npm run dev`.
3. Manual click-through checklist:
   - **Phase 0/1**: marketing site renders, pricing CTA reaches Stripe Checkout in test mode.
   - **Phase 2**: signup creates a `users` row + `llc_formations` row at `not_started`; onboarding stepper advances and persists.
   - **Phase 3**: adding/editing a CRM contact persists and reflects stage changes immediately.
   - **Phase 4**: scheduling a post persists with correct status; calendar view groups by date/platform.
   - **Phase 5**: completing a module marks progress; a session request is visible to the assigned coach (once Phase 6 staff view exists).

## Critical files (Phase 0 starting points)

- `/home/user/UrbanIQ/nixaler-app/src/lib/db/schema/onboarding.ts`
- `/home/user/UrbanIQ/nixaler-app/src/lib/db/schema/crm.ts`
- `/home/user/UrbanIQ/nixaler-app/src/lib/auth/guards.ts`
- `/home/user/UrbanIQ/nixaler-app/src/app/dashboard/onboarding/page.tsx`
- `/home/user/UrbanIQ/nixaler-app/src/lib/config/plans.ts`
