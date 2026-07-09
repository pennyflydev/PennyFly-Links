# Environment & integrations

Every environment variable and every external service, plus how to turn each on. `.env.local` (repo root) is **gitignored** — it holds all secrets and must be hand-carried between machines. A redacted template lives at [`.env.example`](../.env.example).

`NEXT_PUBLIC_*` vars are shipped to the browser; everything else is server-only.

## Environment variables

| Variable | Group | Public | Required? | Without it |
|---|---|:--:|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | ✅ | Required | Auth won't load |
| `CLERK_SECRET_KEY` | Clerk | | Required | Server auth fails |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `_SIGN_UP_URL` | Clerk | ✅ | Required | Auth routing breaks |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `_AFTER_SIGN_UP_URL` | Clerk | ✅ | Optional | Clerk default redirect |
| `CLERK_WEBHOOK_SECRET` | Clerk | | Required for webhook | User→DB sync webhook rejects events |
| `ADMIN_CLERK_USER_ID` | Clerk | | Optional | No auto-admin promotion |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✅ | Required | No DB access |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | ✅ | Required | Anon/public reads fail |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | | Required | Server/admin writes fail |
| `STRIPE_SECRET_KEY` | Stripe | | For billing | All Stripe calls fail (**empty now**) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | ✅ | For billing | Checkout UI can't init (**empty now**) |
| `STRIPE_WEBHOOK_SECRET` | Stripe | | For billing | Webhook events rejected (**empty now**) |
| `STRIPE_*_PRICE_ID` (×6: starter/pro/label × monthly/yearly) | Stripe | | Per plan | That plan can't be purchased (**empty now**) |
| `STRIPE_PLATFORM_FEE_BPS` | Connect | | Optional (default 250) | Falls back to 2.5% fee |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify | | For Spotify | Pre-save/insights inert |
| `SPOTIFY_REDIRECT_URI` | Spotify | | For Spotify | OAuth redirect mismatch |
| `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` | Spotify | ✅ | Optional | Informational (not read server-side) |
| `CRON_SECRET` | Cron | | For cron | Release-day cron endpoint unprotected |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | Twilio | | Optional | SMS inert (no-op) (**empty now**) |
| `GOOGLE_WALLET_ISSUER_ID` / `_CLASS_ID` / `_SA_EMAIL` / `_SA_PRIVATE_KEY` | Google Wallet | | Optional | "Add to Wallet" button hidden (**empty now**) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push | mixed | Optional | Web-push drop alerts off |
| `BANDSINTOWN_APP_ID` | Bandsintown | | Optional (default `flylink`) | Uses fallback id; still works |
| `RESEND_API_KEY` | Email | | Optional | Ticket emails don't send (redirect still works) |
| `EMAIL_FROM` | Email | | Optional | Ticket emails don't send |
| `AWEBER_*` / `MAILCHIMP_*` | Email | mixed | Optional | **Not wired in code** — inert |
| `NEXT_PUBLIC_APP_URL` | App | ✅ | Required | Local redirect/return URLs break |
| `NEXT_PUBLIC_PROD_URL` | App | ✅ | Required | Prod URLs fall back to hardcoded default |
| `NEXT_PUBLIC_APP_NAME` | App | ✅ | Optional | Branding label missing |

> **Currently inert (unconfigured):** Stripe billing + Connect, Twilio SMS, Google Wallet, Resend (ticket email), the Clerk webhook secret, and AWeber/Mailchimp (not even wired in code). **Configured/active:** Clerk auth, Supabase, Spotify, Web Push, Bandsintown, Shopify (per-artist), Odesli.

## External integrations & how to activate

### Clerk — auth + user sync
Wrapped by the Clerk SDK (provider + `src/proxy.ts`); webhook at `src/app/api/webhooks/clerk/route.ts`.
**Activate:** create a Clerk app → set publishable/secret keys. Add a webhook endpoint `{PROD_URL}/api/webhooks/clerk` (user events) → paste its Signing Secret into `CLERK_WEBHOOK_SECRET`. Set `ADMIN_CLERK_USER_ID` to your Clerk user id for admin. Currently on the **development** instance — switch to production (pk_live) before public launch.

### Supabase — database + storage
`src/lib/supabase/{client,server,queries}.ts`. **Activate:** create project → set URL + anon + service-role keys → run `schema.sql` (fresh) or `RUN_ALL_pending_migrations.sql` (existing). Images use a public `media` bucket (auto-created by `/api/upload`).

### Stripe billing — SaaS subscriptions
`src/lib/stripe/index.ts`; routes `api/billing/checkout`, `api/billing/portal`; webhook `api/webhooks/stripe`. **Activate:** create Stripe account → secret + publishable keys → 3 products with monthly/yearly prices → paste the 6 price IDs → add webhook `{APP_URL}/api/webhooks/stripe` (subscription events) → `STRIPE_WEBHOOK_SECRET`.

### Stripe Connect — artist payouts (Express, 2.5%)
`src/lib/stripe/connect.ts`; routes `api/connect/{onboard,login,checkout}`, `api/tickets/checkout`. Uses **destination charges** with an `application_fee` so money settles to the artist's own account. **Activate:** enable **Connect** in Stripe → artists onboard via `/dashboard/payments` (Express account links). The Stripe webhook's `account.updated` keeps `stripe_charges_enabled` in sync; `checkout.session.completed` issues paid tickets (`kind='ticket'`). Fee via `STRIPE_PLATFORM_FEE_BPS` (250 = 2.5%).

### Spotify — pre-save + insights
`src/lib/spotify/index.ts`; `api/auth/spotify/{start,callback}`. Scopes: `user-read-email`, `user-library-modify`, `user-follow-modify`. **Activate:** create a Spotify app → client id/secret → register redirect `{PROD_URL}/api/auth/spotify/callback`. Dev mode caps at 25 users — request a quota extension before launch. Note: the public API has **no** stream counts/monthly listeners; insights use followers/popularity/top-tracks.

### Twilio — SMS drop alerts
`src/lib/sms/twilio.ts`; inbound `api/sms/webhook` (signature-verified). **Activate:** Twilio account → number or Messaging Service SID → **10DLC** brand/campaign registration for US A2P → set `TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM` → point the number's inbound webhook at `{PROD_URL}/api/sms/webhook` (handles STOP/START/HELP).

### Google Wallet — passes + tickets
`src/lib/wallet/google.ts` (returns `null` when unconfigured). **Activate:** Google Wallet console → issuer account + a generic pass class → a Google Cloud service account with Wallet API access → set `GOOGLE_WALLET_ISSUER_ID`, `_CLASS_ID`, `_SA_EMAIL`, `_SA_PRIVATE_KEY`. Powers both the artist loyalty pass and event tickets (barcode = ticket token). **Apple Wallet is deferred** — needs an Apple Developer account + Pass Type ID + PKCS#7 signing.

### Web Push / VAPID
`src/lib/push/index.ts`; client subscribe in `src/app/[slug]/DropAlerts.tsx`. **Activate:** `web-push generate-vapid-keys` → set public/private keys + a `mailto:` subject. (Currently configured.)

### Bandsintown — tour import
`src/lib/bandsintown/index.ts`. **Activate:** optional — request a free App ID and set `BANDSINTOWN_APP_ID`; works on the fallback id otherwise.

### Shopify Storefront — merch
`src/lib/shopify/storefront.ts`. **No platform env** — each artist supplies their own store domain + Storefront access token (stored in `artists`), created in their own Shopify admin.

### Resend — transactional email (ticket delivery)
`src/lib/email/index.ts` (`isEmailConfigured()` gates it; `sendTicketEmail()` emails the buyer their `/ticket/[token]` link after a free claim or paid purchase). **Activate:** create a Resend account → API key → verify a sending domain → set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `"FlyLink <tickets@yourdomain.com>"`; `onboarding@resend.dev` works for quick tests). Inert until set — the on-screen ticket redirect still works without it.

### Odesli (song.link) — streaming link resolution
`src/lib/odesli/index.ts`. Public API, **no credentials**. Always active.

### AWeber / Mailchimp — email sync (NOT wired)
Env vars exist and marketing copy references them, but there is **no code** reading them yet. Building this is on the roadmap.
