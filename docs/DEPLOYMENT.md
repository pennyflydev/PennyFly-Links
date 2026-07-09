# Deployment & go-live

## How deploys work

- **GitHub → Vercel is automatic.** Pushing `main` (public repo `pennyflydev/PennyFly-Links`) triggers a Vercel production deploy. There is no staging gate — `npm run build` must be green before you push.
- **Cron:** `vercel.json` registers a daily cron hitting `/api/cron/fulfill-presaves` at 09:00 UTC. Vercel automatically attaches `CRON_SECRET` as the `Authorization: Bearer` header, so just setting `CRON_SECRET` in the env makes it authenticate.
- **GitHub push access** (from the project notes): company repos are made public and the `PostScore`/`88dragon10` account is added as a collaborator so pushes can go through it. Any authenticated git client works.

## First-time / new-environment setup

### 1. Database — one paste
Open Supabase → SQL Editor → paste **all of `supabase/RUN_ALL_pending_migrations.sql`** → Run. It's idempotent (safe to re-run). This brings any existing DB up through migration 0032. (For a brand-new DB you can instead run `supabase/schema.sql`.)

> Note: line ~29 (`update profiles set onboarded = true`) marks all existing profiles onboarded — intended, so old accounts skip onboarding.

### 2. Environment variables (Vercel → Settings → Environment Variables)
Set for **Production** (and Preview if you use preview deploys), then **redeploy** — env changes don't apply until the next deploy. Full reference: [ENVIRONMENT.md](ENVIRONMENT.md). The **currently-live** app already has Clerk, Supabase, Spotify, VAPID, and app URLs set.

Verify these are present and correct in production:
- `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_PROD_URL` = the production URL (NOT `localhost`)
- Clerk keys + `CLERK_WEBHOOK_SECRET`
- Supabase URL + anon + service-role keys
- Spotify keys + redirect URIs, `CRON_SECRET`
- VAPID keys

### 3. Activation steps by feature (do these as you turn features on)

| To activate | Do this |
|---|---|
| **Clerk webhook** (signup → DB) | Add endpoint `{PROD_URL}/api/webhooks/clerk` in Clerk → paste Signing Secret into `CLERK_WEBHOOK_SECRET` |
| **Spotify** at scale | Request quota extension (dev mode caps at 25 users); switch redirect URIs to prod |
| **Stripe billing** | Create products + 6 price IDs; set Stripe keys; add webhook `{APP_URL}/api/webhooks/stripe` (subscription events) |
| **Stripe Connect** (payouts/tickets) | Enable Connect in Stripe; add `account.updated` + `checkout.session.completed` to the webhook; set `STRIPE_PLATFORM_FEE_BPS=250` |
| **Twilio SMS** | Buy a number / Messaging Service; complete 10DLC; set `TWILIO_*`; point inbound webhook at `{PROD_URL}/api/sms/webhook` |
| **Google Wallet** | Create issuer + generic class + service account; set `GOOGLE_WALLET_*` |
| **Clerk production** | Switch from the development instance (pk_test) to production (pk_live) before public launch |

Everything not yet configured is **inert** (no crashes) — see the inert-until-configured pattern in [DEVELOPMENT.md](DEVELOPMENT.md).

## Moving the project to another machine

1. `git clone` the public repo + `npm install`.
2. **Hand-carry `.env.local`** — it's gitignored and holds every secret. Move it securely (USB / password-manager note), not email/chat.
3. `npm run build` to confirm.

Nothing about the live site or Vercel deploys changes based on which machine you push from.

## Pre-launch checklist (outstanding)

- Switch Clerk **development → production** instance.
- Configure Stripe billing + Connect (keys, products, webhooks).
- Configure Twilio (number + 10DLC) if launching SMS.
- Spotify quota extension.
- Decide on email provider for transactional email (ticket delivery — see [ROADMAP.md](ROADMAP.md)).
- Custom domains per artist (needs a Vercel domain API token + wiring — not built).
