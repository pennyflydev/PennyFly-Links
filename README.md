# FlyLink

**A music smart-link + ticketing SaaS** — "Linktree for artists," built for the Pennyfly record label with a label / multi-tenant layer on top. Artists get a customizable link-in-bio page, streaming smart links, pre-save campaigns, a store, memberships, fan CRM, SMS/push drop alerts, and a full artist-run **ticketing** system (QR tickets, wallet passes, door scanner). Labels get a roster dashboard, aggregate analytics, team roles, and cross-roster campaigns.

- **Live:** https://penny-fly-links.vercel.app
- **Repo:** https://github.com/pennyflydev/PennyFly-Links (public)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, TypeScript) — ⚠️ read [`AGENTS.md`](AGENTS.md); this is not the Next.js you remember |
| Styling | Tailwind CSS |
| Auth | **Clerk** (artists, labels, fans) |
| Database | **Supabase** (Postgres + RLS) + Supabase Storage |
| Hosting | **Vercel** (auto-deploys `main`; daily cron) |
| Payments | **Stripe** (SaaS billing) + **Stripe Connect Express** (artist payouts, 2.5% fee) |
| Integrations | Spotify, Twilio (SMS), Google Wallet, web-push/VAPID, Bandsintown, Shopify Storefront, Odesli |

## Quick start

```bash
git clone https://github.com/pennyflydev/PennyFly-Links
cd PennyFly-Links
npm install
# Create .env.local from the reference (see docs/ENVIRONMENT.md) — it is gitignored
npm run dev          # http://localhost:3000
```

> The app **depends on live external services** (Supabase, Clerk, etc.). Without a populated `.env.local` most pages won't function. `npm run build` is the primary local verification — see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Documentation

| Doc | What's in it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the system is put together: auth model, the admin-client pattern, roles/multi-tenancy, request flow, key conventions |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, the **feature-build workflow**, migration process, Next.js 16 gotchas, "inert-until-configured" pattern, commit/deploy conventions |
| [docs/DATABASE.md](docs/DATABASE.md) | Every table, columns, RLS posture, relationships, and the full migration list |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Every environment variable and every external integration + how to activate each |
| [docs/FEATURES.md](docs/FEATURES.md) | Feature catalog mapped to routes, APIs, migrations, and activation state |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel deploy, the one-paste DB migration, env checklist, and the go-live activation steps |
| [docs/ROADMAP.md](docs/ROADMAP.md) | What's shipped, what's pending, and what's intentionally deferred |

## Repo layout

```
src/
  app/                     # App Router: pages + /api route handlers
    (auth)/                # /sign-in, /sign-up
    (dashboard)/dashboard/ # artist dashboard
    (label)/               # /admin, /roster
    fans/(app)/            # signed-in fan feed
    [slug]/                # public artist page
    api/                   # route handlers (see docs/FEATURES.md)
  components/              # shared UI (dashboard sidebar, pixels, etc.)
  lib/                     # integration wrappers + Supabase queries
    supabase/              # client, server (admin), queries
    stripe/                # billing + connect
    spotify/  sms/  wallet/  bandsintown/  odesli/  shopify/  push/  tickets/
  proxy.ts                # middleware (NOT middleware.ts — Next 16)
supabase/
  schema.sql              # full consolidated schema (fresh DB)
  migrations/             # 0002 … 0032 incremental migrations
  RUN_ALL_pending_migrations.sql  # idempotent combined block (run once)
docs/                     # this documentation set
AGENTS.md                 # Next.js 16 warning — read before coding
```
