# Architecture

How FlyLink is put together, and the handful of patterns you must understand before changing anything.

## The big picture

```
Browser ──▶ Vercel (Next.js 16 App Router)
                │
                ├─ Clerk         → authentication (artists, labels, fans)
                ├─ Supabase      → Postgres (all data) + Storage (images)
                ├─ Stripe        → SaaS billing + Connect (artist payouts)
                └─ Integrations  → Spotify, Twilio, Google Wallet, web-push,
                                   Bandsintown, Shopify, Odesli
```

Everything runs inside one Next.js app. Server Components + `/api` route handlers talk to Supabase and the integrations; Client Components handle interactivity.

## Auth model — the single most important thing

**Clerk is the auth layer, NOT Supabase.** This has a critical consequence:

> Supabase Row Level Security is **not** the primary access-control layer. Almost all server code uses the **service-role admin client** (`createAdminClient()`), which **bypasses RLS entirely**. Access control is enforced in application code by scoping every query to the current user's artist/label.

Why: Supabase RLS policies key off `auth.uid()` (a Supabase JWT). Our users authenticate with Clerk, so `auth.uid()` is null in our requests — RLS policies that reference it would never match. So:

- **Reads/writes for a signed-in user** go through `createAdminClient()` and are manually filtered by `.eq('artist_id', artist.id)` etc.
- **RLS policies still exist and still matter** for the **public anon path**: the public artist page uses the anon client (`createClient()`), and the `using (is_published)` / `using (true)` policies are what make public data readable while keeping private tables (subscribers, tokens, tickets) invisible.

### Resolving "who is this request?"

All in `src/lib/supabase/queries.ts` (wrapped in React `cache()` to dedupe within a request):

- `getCurrentProfile()` → the real logged-in profile (`{ id, role, clerk_id, onboarded }`). Never impersonated.
- `getArtistForCurrentUser()` → the artist whose dashboard this request acts on. **Honors the impersonation cookie** when the caller is authorized (admin, or a label over its own roster).
- `getLabelForUser(profileId)` → the label a profile **owns or is a team member of**, plus their `memberRole` (`owner`/`manager`/`viewer`).
- `canManageArtist(profile, artist)` → gate for impersonation / cross-artist writes.
- `getArtistBySlug(slug)` → **public** read via the anon client (RLS applies). Selects `*` on `artists`, so newly added columns are automatically available on public pages.

Every `/api` handler for owned data follows the same opening:

```ts
const { userId } = await auth()
if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const artist = await getArtistForCurrentUser()
if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
const supabase = createAdminClient()
// ...always scope by artist.id
```

## Roles & multi-tenancy

`profiles.role` is one of `admin | label | artist | fan`.

| Role | Who | Experience |
|---|---|---|
| `admin` | Pennyfly team (super-admin) | `/admin` platform console + `/roster` (all artists) + "Act as" anyone + promote/demote |
| `label` | A customer account owning a roster | `/roster` scoped to their own artists; invite + act-as own artists |
| `artist` | An individual artist | The `/dashboard/*` experience |
| `fan` | A listener | `/fans` feed; follows artists; no artist page |

- **Labels** own artists via `artists.label_id`. `getLabelForUser` resolves a label by **ownership OR team membership**.
- **Impersonation ("Act as")**: `/api/impersonate` sets an httpOnly cookie; `getArtistForCurrentUser` honors it when `canManageArtist` passes. A banner shows while active. Edits apply to the impersonated artist.
- **Account type is chosen at onboarding**: fresh signups (not admin, not invited) hit `/onboarding` to pick artist vs label. Invited emails auto-join as signed artists or label members via the Clerk webhook. Fans sign up at `/fans/sign-up` (see below).

## How a fan becomes a "fan" (not an artist)

Every normal signup would create an artist via the Clerk webhook. Fans are different:

1. `/fans/sign-up` uses Clerk's `<SignUp unsafeMetadata={{ accountType: 'fan' }}>`.
2. The Clerk webhook (`/api/webhooks/clerk`) reads `unsafe_metadata.accountType === 'fan'` and creates a `role='fan'` profile **with no artist row**.
3. The dashboard layout redirects any `role='fan'` user to `/fans`.
4. Slug generation reserves app-route words (`fans`, `dashboard`, `admin`, …) so an artist slug can never shadow a real route.

## Middleware (`src/proxy.ts`)

⚠️ In Next.js 16 the middleware file is **`src/proxy.ts`**, not `middleware.ts`.

- **Public** (pass straight through): `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/pricing`, `/api/webhooks/(.*)`, `/api/odesli`, and the broad public-artist matchers `/:slug` and `/:slug/(.*)`.
- **Protected** (redirect to `/sign-in` when signed out): `/dashboard(.*)`, `/roster(.*)`, `/admin(.*)`, `/onboarding`.
- **Everything else** (`/fans/*`, `/events/*`, `/ticket/*`, most `/api/*`) runs `auth()` but does **not** force-redirect — those routes enforce their own auth in-handler or are intentionally public.

> **Gotcha:** because `/:slug` matches any single top-level segment as a public artist page, a new top-level route is treated as public by the middleware unless you add it to the protected matchers. Literal folder routes (e.g. `src/app/fans/`) still win over the `[slug]` dynamic route in the App Router, and their layouts do their own auth guarding.

## Public artist page composition

`src/app/[slug]/page.tsx` is the heart of the product. It fetches the artist via `getArtistBySlug` (anon) plus a few admin-client fetches for secret data (exclusive `reward_url`, label campaigns), then renders, in order: profile + follow + wallet, label campaigns, drop alerts (push + SMS), pre-saves, FlyLinks (streaming buttons), follow-to-unlock exclusives, membership tiers, Shopify merch, playlists, media embeds, store (native Stripe checkout), custom links, fan wall, footer. Section order/visibility come from `artist_page_sections`.

## Integration wrappers (`src/lib/`)

Each external service is wrapped in a small lib that is **inert until configured** (returns `null` / `false` / a 503 when its env vars are missing) — see [DEVELOPMENT.md](DEVELOPMENT.md#the-inert-until-configured-pattern):

`supabase/` (client, server-admin, queries) · `stripe/` (billing) · `stripe/connect.ts` (Connect Express) · `spotify/` · `sms/twilio.ts` · `wallet/google.ts` · `bandsintown/` · `odesli/` · `shopify/storefront.ts` · `push/` · `tickets/`.

## Data-flow examples

**Pre-save → release day:** fan taps "Pre-Save on Spotify" → Spotify OAuth (`/api/auth/spotify/*`) captures a verified email into `subscribers` and stores a refresh token in `spotify_presave_authorizations` → the daily cron `/api/cron/fulfill-presaves` saves the drop to their library on release day, flips the pre-save page into a full streaming link, and pushes an "out now" alert.

**Paid ticket:** fan buys on the public event page → `/api/tickets/checkout` creates a **Stripe Connect destination charge** (money to the artist, 2.5% platform fee) → the Stripe webhook (`checkout.session.completed`, `kind='ticket'`) issues the `tickets` row → fan lands on `/ticket/[token]` (QR + Add to Google Wallet) → door staff scan → `/api/tickets/validate` flips the ticket to `used` atomically (first-scan-wins).
