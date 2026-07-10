# Cleanup & optimization log

A running log of UI cleanup, refactors, and performance work so sections aren't
re-touched. Newest first. Each entry: what changed, files, commit.

## UI

- **Overview nav active-state fix + responsive stat grids** — _(this commit)_
  Sidebar "Overview" pointed at `/dashboard` (which redirects to
  `/dashboard/overview`), so it never highlighted as active — repointed to
  `/dashboard/overview`. Made fixed `grid-cols-3/4` stat rows responsive
  (`grid-cols-2 md:grid-cols-4`, `grid-cols-1 sm:grid-cols-3`) across overview,
  analytics, subscribers, admin, roster, roster/[artistId], tickets, sms, tips.

- **Mobile responsiveness: data tables + settings tabs** — `7442e7a`
  Wrapped the roster, Label HQ, and subscribers tables in `overflow-x-auto` +
  `min-w-[640px]` (they were raw tables inside `overflow-hidden` cards → clipped
  on mobile). Analytics already had this. Settings page inner layout now stacks
  on mobile (`flex-col md:flex-row`) with a horizontal-scroll tab rail.

- **Responsive sidebar (mobile drawer)** — `a08cc9d`
  `Sidebar.tsx` + both layouts. Below `md`: fixed top bar w/ hamburger, off-canvas
  drawer over a backdrop (closes on backdrop/X/route-change). `md+` unchanged.
  Layouts got `pt-14 md:pt-0`. ⚠️ not pixel-verified (auth-gated).

- **Role-aware sidebar** — `76462b6`
  `Sidebar.tsx` gains a `variant` prop. `(dashboard)` layout → `artist` (grouped
  artist nav; also what an impersonating label sees). `(label)` layout → `label`
  (Label HQ + Roster + Platform-for-admin, account-only footer). Fixes labels
  seeing bouncing artist links on `/label` & `/roster`.

- **Sidebar grouped into sections** — `2e3dca5`
  Flat 14-item list → labelled groups (Content / Monetize / Audience) + primary
  items up top. Settings moved to footer. Nav scrolls on overflow.

- **Account drawer + settings dead-tab cleanup** — `bc4e7af`
  New `AccountMenu.tsx` replaces the bare Clerk `<UserButton/>`: full-width
  clickable bar → popover (current account, switch accounts [Clerk multi-session,
  needs Clerk Pro], add account, manage account, settings/billing, sign out).
  Settings page: `Account` and `Notifications` tabs were "Coming soon" → now real
  (Clerk manage + sign out; SMS/push links).

- **Landing + pricing rewrite** — `d3ce224`
  `page.tsx` (Share/Monetize/Grow pillars, product mockup, 2.5%-fee angle, FAQ,
  footer), `pricing/page.tsx` (monthly/annual toggle, real feature lists), and
  `layout.tsx` metadata (OpenGraph/Twitter). ⚠️ email-sync + custom-domains are
  advertised but unbuilt (marketing debt — build or pull before launch).

## Performance

- **Public page + hot-FK indexes** — `1e9d1bc`
  `getArtistBySlug` wrapped in `cache()` (was running its 11-join query twice per
  load). `[slug]` page waterfall (5 sequential queries) → one `Promise.all`.
  Migration `0036`: indexes on `analytics_events(artist_id,event_type)`,
  `streaming_links(promo_link_id)`, and `artist_id` on 9 content tables.

## Correctness / dead code

- **Store-purchase gap + dead code** — `0461e5e`
  Migration `0034` (`purchases`) + stripe webhook `product` branch + receipt
  email. Deleted dead `/api/subscribe`.
