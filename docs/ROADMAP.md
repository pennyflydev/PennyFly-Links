# Roadmap & status

Snapshot of what's shipped, what's next, and what's deliberately deferred, as of the last handoff.

## Shipped

The full product is feature-complete across: artist pages, smart links, pre-save (with release-day auto-flip + notify), analytics + Spotify insights, subscribers/superfan CRM, events + Bandsintown import, **ticketing** (types, QR ticket, Google Wallet ticket, door scanner, reporting, **emailed ticket delivery** via Resend), store, memberships + follow-to-unlock, Shopify, playlists/embeds/fan wall, pixels/SEO/appearance, web-push + SMS drop alerts, fan accounts, referrals, wallet passes, Stripe Connect foundation + native store checkout, SaaS billing, and the full label layer (roster, team roles, campaigns, broadcast, impersonation).

Migrations run 0002 → **0033**.

## In progress / next up

The last active thread was **ticketing polish**. Status:

- ✅ **Email the ticket to the buyer** — shipped. `src/lib/email/index.ts` (Resend HTTP API, inert-until-configured) sends the ticket link on free claim (`/api/tickets/claim`) and on paid issue (Stripe webhook `checkout.session.completed`, `kind='ticket'`). Needs `RESEND_API_KEY` + `EMAIL_FROM` to go live; the on-screen redirect still works without it.

- ✅ **iOS camera scanning** — shipped. The door scanner (`.../events/[id]/scan/ScannerClient.tsx`) now opens the camera on every browser: native `BarcodeDetector` on Chrome/Android, a `jsQR` canvas-decode fallback on iOS Safari. Manual entry remains for when the camera is unavailable/denied. Pure code, no accounts.

Recommended order for what's left:

1. **Apple Wallet ticket pass.** Deferred — needs an Apple Developer account ($99/yr) + Pass Type ID + PKCS#7 `.pkpass` signing. Build once that account exists. (Google Wallet tickets already work.)

## Saved for later (Stripe Connect increments)

The Connect foundation is in (`src/lib/stripe/connect.ts`, `/dashboard/payments`, native store checkout). These build on it and were parked when ticketing was prioritized. Each needs a `checkout.session.completed` branch in the Stripe webhook:

- ✅ **Tips / tip jar** — shipped (migration 0033). `kind='tip'` checkout, `tips` table, public `TipJar` widget on the artist page (gated on `tips_enabled` + `stripe_charges_enabled`), `/dashboard/tips` (enable + received-tips list). Inert until Stripe/Connect are live.
- ✅ **Paid unlocks** — shipped (migration 0035). `exclusive_content.price_cents > 0` makes an unlock pay-to-reveal (0 keeps the Spotify-follow gate); `kind='paid_unlock'` checkout, `unlocks` table, reward revealed on `/unlock/success` after payment + emailed. Inert until Stripe/Connect live.
- **Native recurring memberships** — memberships currently use external `join_url`; make them real Connect subscriptions ("your cut")
- **Label revenue splits** — split one charge between label + artist (multi-party; the complex one — build **last**)

## Also pending

- **Email integrations** (AWeber → Mailchimp → Klaviyo): env vars + `email_integrations` table exist, but there is **no code** wired yet. Auto-sync captured `subscribers` to the artist's list.
- **Google/YouTube pre-save connector** — a second email-capable pre-save source alongside Spotify (needs Google Cloud OAuth).
- **Custom domains per artist** — needs a Vercel domain API token + wiring.
- **AI copilot** (bio/caption writer + analytics insights) — **explicitly deferred** by the owner; do not build unless asked.

## Product decisions on record

- **Stripe Connect = Express model, 2.5% platform fee.** Artists onboard via Stripe-hosted flow (no pre-existing Stripe account needed); money settles to their own account via destination charges; FlyLink never holds funds.
- **Ticketing v1 = single-scan redemption, no dynamic/rotating QR, web-first.** First scan wins; wallet passes are an enhancement, not a dependency.
- **Honesty over feature-theater** — surface real API limits (Spotify stream counts, Apple Wallet) rather than faking them.
