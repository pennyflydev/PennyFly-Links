# Feature & route map

Every route and API in the app, plus a feature catalog with activation state. See [DATABASE.md](DATABASE.md) for tables and [ENVIRONMENT.md](ENVIRONMENT.md) for activation.

## Feature catalog

| Feature | Where | Migration | State |
|---|---|---|---|
| Public artist page (link-in-bio) | `/[slug]` | core | ✅ live |
| Smart links (FlyLinks) + Odesli autofill | `/dashboard/links`, `/[slug]/[linkSlug]`, `/embed/*` | core | ✅ live |
| Pre-save campaigns → auto-flip + notify | `/dashboard/pre-save`, `/pre-save/[slug]` | 0005, 0025 | ✅ live (Spotify) |
| Analytics (views/clicks/geo/device) + Spotify insights | `/dashboard/analytics` | 0014, 0028 | ✅ live |
| Subscribers / fan CRM + superfans | `/dashboard/subscribers` | 0024 | ✅ live |
| Events + Bandsintown import | `/dashboard/events`, `/events/[slug]` | 0009, 0027 | ✅ live |
| **Ticketing** (types, QR ticket, scanner, reporting, emailed delivery) | `/dashboard/events/[id]/tickets` + `/scan`, `/ticket/[token]` | 0032 | ✅ free live; paid needs Connect; email needs Resend |
| Store (digital products) | `/dashboard/store`, public Store section | 0016, 0034 | ✅ live; native checkout needs Connect — sales recorded in `purchases` + buyer receipt emailed |
| Memberships + follow-to-unlock exclusives | `/dashboard/membership` | 0022, 0023 | ✅ live (memberships external links; native = Connect) |
| Paid unlocks (pay to reveal exclusive) | `/dashboard/membership`, `/unlock/success` | 0035 | ✅ built; needs Connect payouts live |
| Tip jar (one-off fan tips via Connect) | `/dashboard/tips`, public Support section | 0033 | ✅ built; needs Connect payouts live |
| Shopify merch | Store section | 0017 | ✅ per-artist |
| Playlists, media embeds, fan wall, custom links | artist page editor | 0007, 0012, 0008 | ✅ live |
| Marketing pixels, SEO, white-label, appearance | `/dashboard/settings`, editor | 0002, 0013, 0015 | ✅ live |
| Web-push drop alerts | public page + `/dashboard` | 0018 | ✅ live |
| **SMS drop alerts** (consent/STOP/10DLC) | `/dashboard/sms` | 0030 | ⚙️ inert until Twilio |
| Fan accounts (follow + feed) | `/fans`, `/fans/sign-up` | 0026 | ✅ live |
| Referrals | `/dashboard/refer`, `/r/[code]` | 0010 | ✅ live |
| Wallet passes (artist + ticket) | public page, ticket page | 0029 | ⚙️ Google inert until config; Apple deferred |
| **Payments / Stripe Connect** | `/dashboard/payments` | 0031 | ⚙️ inert until Stripe+Connect |
| SaaS billing (plans) | `/dashboard/settings` → Billing | 0006 | ⚙️ inert until Stripe |
| Label roster, team, campaigns, broadcast | `/roster`, `/admin` | 0003, 0019-0021 | ✅ live |
| Impersonation ("Act as") | roster | — | ✅ live |

Legend: ✅ live · ⚙️ built but inert until an account/env is configured.

## Page routes

Route groups in `()` add no URL segment. `[[...x]]` are Clerk catch-alls.

**Public:** `/` · `/pricing` · `/[slug]` (artist page) · `/[slug]/[linkSlug]` (release) · `/embed/[slug]/[linkSlug]` (iframe) · `/events/[slug]` · `/pre-save/[slug]` · `/ticket/[token]` · `/ticket/success` · `/sign-in` · `/sign-up` · `/fans/sign-up`
**Fan (authed):** `/fans` (own layout + guard)
**Artist (Clerk-gated):** `/onboarding` · `/dashboard` + `/dashboard/{overview,artist-page,links,links/create,links/[id]/edit,analytics,pre-save,pre-save/create,pre-save/[id]/edit,events,events/create,events/[id]/edit,events/[id]/tickets,events/[id]/scan,store,store/create,store/[id]/edit,membership,tips,payments,subscribers,sms,fan-wall,settings,refer}`
**Label/admin:** `/admin` · `/roster` · `/roster/[artistId]`
**Handler:** `/r/[code]` (referral redirect)

## API routes

Auth: **Artist** = `auth()` + `getArtistForCurrentUser`; **Profile** = `getCurrentProfile`; **Label/Admin** = role-checked; **Public** = none; **Webhook** = provider signature; **Cron** = `Bearer CRON_SECRET`.

### Artist page content (Artist)
`/api/artist` GET·PATCH · `/api/links` GET·POST · `/api/links/[id]` GET·PATCH·DELETE · `/api/links/health` GET · `/api/custom-links` GET·PUT · `/api/social-links` GET·PUT · `/api/media-embeds` GET·PUT · `/api/sections` GET·PATCH · `/api/playlists` GET·PUT

### Pre-save & Spotify
`/api/presave` GET·POST · `/api/presave/[id]` GET·PATCH·DELETE (Artist) · `/api/spotify/artist` PATCH (Artist) · `/api/auth/spotify/start` GET · `/api/auth/spotify/callback` GET (Public OAuth)

### Events & tickets
`/api/events` GET·POST · `/api/events/[id]` GET·PATCH·DELETE · `/api/ticket-types` GET·POST · `/api/ticket-types/[id]` PATCH·DELETE · `/api/tickets/validate` POST (all Artist) · `/api/tickets/checkout` POST · `/api/tickets/claim` POST (Public)

### Store / membership (Artist)
`/api/products` GET·POST · `/api/products/[id]` GET·PATCH·DELETE · `/api/memberships` GET·POST · `/api/memberships/[id]` PATCH·DELETE · `/api/exclusive` GET·POST · `/api/exclusive/[id]` PATCH·DELETE

### Fans & engagement
`/api/subscribers/[id]` PATCH (Artist) · `/api/subscribe` POST (Public) · `/api/follow` POST (signed-in fan) · `/api/track` POST (Public) · `/api/fan-wall` GET (Artist)·POST (Public) · `/api/fan-wall/[id]` PATCH·DELETE (Artist)

### SMS & push
`/api/sms/broadcast` POST (Artist) · `/api/sms/subscribe` POST (Public) · `/api/sms/webhook` POST (Twilio) · `/api/push/send` POST (Artist) · `/api/push/subscribe` POST (Public)

### Billing & Connect
`/api/billing/checkout` POST (Profile) · `/api/billing/portal` POST · `/api/connect/onboard` POST · `/api/connect/login` POST (Artist) · `/api/connect/checkout` POST (Public) — `kind`: `product` · `tip` · `paid_unlock`

### Imports & meta
`/api/import/spotify` GET · `/api/import/linktree` GET · `/api/import/bandsintown` POST · `/api/odesli` GET (Public) · `/api/upload` POST

### Label & admin
`/api/label` GET·PATCH · `/api/label/members` GET·POST · `/api/label/campaigns` GET·POST · `/api/label/campaigns/[id]` PATCH·DELETE · `/api/label/broadcast` POST · `/api/label/subscribers` GET (Label) · `/api/invites` GET·POST (Admin/Label) · `/api/admin/set-role` POST (Admin) · `/api/impersonate` POST·DELETE

### Referrals, onboarding, webhooks, cron
`/api/refer` GET · `/api/refer/claim` POST · `/api/onboarding` POST (Profile) · `/api/webhooks/clerk` POST (svix) · `/api/webhooks/stripe` POST (Stripe sig) · `/api/cron/fulfill-presaves` GET (Cron)

## Dashboard sidebar (in order)

Overview · Artist Page · My FlyLinks · Analytics · Pre-save · Events · Store · Membership · Tip Jar · Payments · Subscribers · SMS Alerts · Fan Wall · Settings — then footer: Refer & earn (all), Platform (admin), All Artists/My Roster (admin/label), Account.
