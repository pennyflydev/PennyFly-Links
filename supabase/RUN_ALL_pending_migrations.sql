-- ════════════════════════════════════════════════════════════════════════
-- FlyLink — all pending migrations (0002 → 0010) in one block.
-- Paste the whole thing into the Supabase SQL editor and run once.
-- Safe and idempotent: you can re-run it without harm.
-- ════════════════════════════════════════════════════════════════════════

-- ── 0002 · Marketing pixels ─────────────────────────────────────────────
alter table artists add column if not exists meta_pixel_id      text;
alter table artists add column if not exists tiktok_pixel_id    text;
alter table artists add column if not exists ga_measurement_id  text;

-- ── 0003 · Labels & roles ───────────────────────────────────────────────
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'label', 'artist'));

create table if not exists labels (
  id                uuid primary key default gen_random_uuid(),
  owner_profile_id  uuid not null references profiles(id) on delete cascade,
  name              text not null default '',
  created_at        timestamptz not null default now()
);
alter table labels enable row level security;

alter table artists        add column if not exists label_id uuid references labels(id) on delete set null;
alter table artist_invites add column if not exists label_id uuid references labels(id) on delete cascade;

-- ── 0004 · Onboarding flag ──────────────────────────────────────────────
alter table profiles add column if not exists onboarded boolean not null default false;
update profiles set onboarded = true;   -- don't force existing accounts through onboarding

-- ── 0005 · Spotify pre-save authorizations ──────────────────────────────
create table if not exists spotify_presave_authorizations (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references presave_campaigns(id) on delete cascade,
  artist_id       uuid not null references artists(id) on delete cascade,
  spotify_user_id text not null,
  email           text,
  refresh_token   text not null,
  target_type     text not null check (target_type in ('album', 'track')),
  target_id       text not null,
  fulfilled       boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (campaign_id, spotify_user_id)
);
alter table spotify_presave_authorizations enable row level security;

-- ── 0006 · Stripe billing fields ────────────────────────────────────────
alter table profiles add column if not exists subscription_status text;
alter table profiles add column if not exists current_period_end  timestamptz;

-- ── 0007 · Playlist Spotlight ───────────────────────────────────────────
create table if not exists playlist_spotlights (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  title       text not null default '',
  spotify_url text not null,
  cover_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table playlist_spotlights enable row level security;
drop policy if exists "Anyone can read playlist spotlights" on playlist_spotlights;
create policy "Anyone can read playlist spotlights" on playlist_spotlights for select using (true);

-- ── 0008 · Fan Wall ─────────────────────────────────────────────────────
alter table artists add column if not exists fan_wall_enabled boolean not null default false;

create table if not exists fan_wall_notes (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  name        text not null default '',
  message     text not null,
  is_pinned   boolean not null default false,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table fan_wall_notes enable row level security;
drop policy if exists "Anyone can read approved notes" on fan_wall_notes;
create policy "Anyone can read approved notes" on fan_wall_notes for select using (is_approved = true);

-- ── 0009 · Events ───────────────────────────────────────────────────────
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references artists(id) on delete cascade,
  title        text not null,
  slug         text not null unique,
  description  text default '',
  cover_url    text,
  start_at     timestamptz not null,
  venue        text default '',
  city         text default '',
  ticket_url   text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table events enable row level security;
drop policy if exists "Anyone can read published events" on events;
create policy "Anyone can read published events" on events for select using (is_published = true);

-- ── 0010 · Referral program ─────────────────────────────────────────────
alter table profiles add column if not exists referral_code text unique;

create table if not exists referrals (
  id                  uuid primary key default gen_random_uuid(),
  referrer_profile_id uuid not null references profiles(id) on delete cascade,
  referred_profile_id uuid unique references profiles(id) on delete cascade,
  referred_email      text,
  status              text not null default 'signed_up',
  created_at          timestamptz not null default now()
);
alter table referrals enable row level security;

-- ── 0011 · Link scheduling ──────────────────────────────────────────────
alter table promo_links add column if not exists publish_at timestamptz;
alter table promo_links add column if not exists expires_at timestamptz;

-- ── 0012 · Media embeds ─────────────────────────────────────────────────
create table if not exists media_embeds (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references artists(id) on delete cascade,
  url        text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table media_embeds enable row level security;
drop policy if exists "Anyone can read media embeds" on media_embeds;
create policy "Anyone can read media embeds" on media_embeds for select using (true);

-- ── 0013 · SEO controls + white-label ───────────────────────────────────
alter table artists add column if not exists seo_title       text;
alter table artists add column if not exists seo_description text;
alter table artists add column if not exists hide_branding   boolean not null default false;

-- ── 0014 · Device analytics ─────────────────────────────────────────────
alter table analytics_events add column if not exists device text;

-- ── 0015 · Appearance (font + button style) ─────────────────────────────
alter table artists add column if not exists font         text not null default 'sans';
alter table artists add column if not exists button_style text not null default 'rounded';

-- ── 0016 · Digital product store ────────────────────────────────────────
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references artists(id) on delete cascade,
  title        text not null,
  description  text default '',
  price_cents  integer not null default 0,
  cover_url    text,
  buy_url      text,
  is_published boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
alter table products enable row level security;
drop policy if exists "Anyone can read published products" on products;
create policy "Anyone can read published products" on products for select using (is_published = true);

-- ── 0017 · Shopify merch connector ──────────────────────────────────────
alter table artists add column if not exists shopify_domain text;
alter table artists add column if not exists shopify_token  text;

-- ── 0018 · Web push subscriptions ───────────────────────────────────────
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references artists(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique (artist_id, endpoint)
);
alter table push_subscriptions enable row level security;

-- ════════════════════════════════════════════════════════════════════════
-- Done. Every pending feature (pixels, labels, onboarding, Spotify pre-save,
-- billing, Playlist Spotlight, Fan Wall, Events, Referrals, link scheduling)
-- is now supported.
-- ════════════════════════════════════════════════════════════════════════
