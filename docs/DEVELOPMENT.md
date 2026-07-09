# Development guide

Setup, the conventions this codebase is built on, and the exact workflow for adding a feature. Follow these — they're consistent across all 30+ features already shipped.

## Local setup

```bash
npm install
# Put a populated .env.local at the repo root (gitignored). See docs/ENVIRONMENT.md.
npm run dev      # http://localhost:3000
npm run build    # production build — the primary verification (see below)
```

Node 20+. The app is a single Next.js 16 project; there is no separate backend.

## ⚠️ This is Next.js 16 — read AGENTS.md

`AGENTS.md` at the repo root is not optional. Key differences from older Next.js:

- **Middleware is `src/proxy.ts`**, not `middleware.ts`.
- **`params` and `searchParams` are async** — they are Promises you must `await`:
  ```ts
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  }
  ```
- Route groups `(auth)`, `(dashboard)`, `(label)`, `(app)` add **no** URL segment.
- When in doubt, read the bundled guides under `node_modules/next/dist/docs/`.

## Verification: `npm run build`

There is **no meaningful local preview** for most work — nearly every page depends on the live DB (Supabase), auth (Clerk), and/or external APIs. So:

> **A passing `npm run build` is the verification bar for a change.** It type-checks the whole app and compiles every route. Run it before every commit.

Features that are account-gated (Stripe, Twilio, Google Wallet, paid tickets) cannot be exercised without those accounts; they are built to compile and run **inert** (see below) and verified via the build.

## The inert-until-configured pattern

Every integration must **degrade gracefully** when its env vars are absent — never crash, never show a broken button. Examples already in the repo:

- `isTwilioConfigured()` / `isBillingConfigured()` gate the SMS and Stripe libs; calls no-op or return `503` with a clear message.
- `buildGoogleWalletSaveUrl()` returns `null` when Google Wallet env is missing → the "Add to Wallet" button simply doesn't render.
- `getStripe()` lazily constructs the client only when `STRIPE_SECRET_KEY` exists.

When you add an integration: read its env at call time, return a null/false/503 sentinel when unset, and make the UI hide or explain the disabled state.

## Adding a feature — the standard workflow

This is the repeated recipe. A typical feature touches: a migration, an API route, a dashboard surface, and a public surface.

### 1. Database migration

Create `supabase/migrations/00NN_short_name.sql` (the current HEAD is **0032**; your next is **0033**). Use idempotent DDL:

```sql
alter table artists add column if not exists my_flag boolean not null default false;
create table if not exists my_table ( ... );
alter table my_table enable row level security;
-- Public-read table? add a select policy. Private/secret? no policy (admin-client only).
drop policy if exists "Anyone can read x" on my_table;
create policy "Anyone can read x" on my_table for select using (is_active = true);
```

Then **mirror it into two places**:

- Append the same statements to **`supabase/RUN_ALL_pending_migrations.sql`** (the idempotent combined block the operator pastes into Supabase once). Add a `-- ── 00NN · Name ──` header.
- Add the columns/tables to **`supabase/schema.sql`** (the consolidated full schema used to stand up a fresh DB).

> RLS rule of thumb: tables read on public pages get a `using (is_published/is_active/true)` select policy; private data (subscribers, tokens, tickets, tokens, PII) gets RLS enabled with **no** public policy and is only ever touched by the admin client.

### 2. API route (`src/app/api/.../route.ts`)

Owner-scoped routes start with the standard auth preamble (see [ARCHITECTURE.md](ARCHITECTURE.md#auth-model)) and **always** filter by `artist.id`. Use `createAdminClient()`. Public routes (fan-facing) skip the auth check but must validate inputs and scope by slug/id. Webhooks verify a provider signature; the cron checks `Bearer ${CRON_SECRET}`.

To let the artist settings form save a new `artists` column, add the column name to the `allowed` array in `src/app/api/artist/route.ts`.

### 3. Dashboard surface

A server page under `src/app/(dashboard)/dashboard/<feature>/page.tsx` that resolves the artist and loads data, plus a `Client.tsx` for interactivity. Add a nav item to `src/components/dashboard/Sidebar.tsx` if it deserves top-level placement.

### 4. Public surface

Render on `src/app/[slug]/page.tsx` (or the relevant public page). Remember `getArtistBySlug` selects `*`, so new `artists` columns are already available there.

### 5. Verify, commit, push

```bash
npm run build
git add -A
git commit -m "Feature: short description

Longer body.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

Pushing `main` **auto-deploys to Vercel**. There is no staging gate — build must be green first.

## Git & deploy conventions

- The repo is **public** and deploys are automatic from `main`.
- End commit messages with the `Co-Authored-By:` trailer above.
- CRLF/LF warnings on Windows are cosmetic — ignore them.
- Ship one feature per commit; keep migrations paired with the code that needs them.

## Honesty / scope discipline

This project has a hard rule, reflected throughout: **don't overclaim.** If an API genuinely can't do something, say so in the UI and to the user rather than faking it. Real examples baked into the code and copy:

- Spotify's public API **cannot** return stream counts / monthly listeners → the insights panel shows followers/popularity/top-tracks and says so.
- **Apple Wallet** passes need an Apple Developer cert → deferred, and the UI says why.
- **iOS Safari** lacks the native `BarcodeDetector` → the door scanner uses a `jsQR` canvas-decode fallback so iPhone camera scanning works; the manual-entry field remains for when the camera is unavailable or permission is denied.

When you hit a similar wall, surface it; don't paper over it.

## Where to look

- Auth/query helpers: `src/lib/supabase/queries.ts`
- Admin vs anon client: `src/lib/supabase/server.ts`
- Middleware: `src/proxy.ts`
- Shared utils (`isLinkLive`, `toMediaEmbed`, `deviceFromUA`, `slugify`, appearance helpers): `src/lib/utils.ts`
- Full route/API/feature map: [FEATURES.md](FEATURES.md)
