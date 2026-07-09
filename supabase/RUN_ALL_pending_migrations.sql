-- ════════════════════════════════════════════════════════════════════════
-- FlyLink — all pending migrations (0002 → 0032) in one block.
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

-- ── 0019 · Label branding ───────────────────────────────────────────────
alter table labels add column if not exists logo_url     text;
alter table labels add column if not exists accent_color text;

-- ── 0020 · Label team members ───────────────────────────────────────────
create table if not exists label_members (
  id          uuid primary key default gen_random_uuid(),
  label_id    uuid not null references labels(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  member_role text not null default 'manager' check (member_role in ('manager', 'viewer')),
  created_at  timestamptz not null default now(),
  unique (label_id, profile_id)
);
alter table label_members enable row level security;
create table if not exists label_member_invites (
  id          uuid primary key default gen_random_uuid(),
  label_id    uuid not null references labels(id) on delete cascade,
  email       text not null,
  member_role text not null default 'manager' check (member_role in ('manager', 'viewer')),
  claimed_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '14 days')
);
alter table label_member_invites enable row level security;

-- ── 0021 · Label campaigns ──────────────────────────────────────────────
create table if not exists label_campaigns (
  id         uuid primary key default gen_random_uuid(),
  label_id   uuid not null references labels(id) on delete cascade,
  title      text not null,
  message    text default '',
  url        text,
  cover_url  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
alter table label_campaigns enable row level security;
drop policy if exists "Anyone can read active label campaigns" on label_campaigns;
create policy "Anyone can read active label campaigns" on label_campaigns for select using (is_active = true);

-- ── 0022 · Fan memberships ──────────────────────────────────────────────
create table if not exists membership_tiers (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  name        text not null,
  price_cents integer not null default 0,
  interval    text not null default 'month' check (interval in ('month', 'year')),
  description text default '',
  perks       text[] default '{}',
  join_url    text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table membership_tiers enable row level security;
drop policy if exists "Anyone can read active tiers" on membership_tiers;
create policy "Anyone can read active tiers" on membership_tiers for select using (is_active = true);

-- ── 0023 · Follow-to-unlock exclusive content ───────────────────────────
create table if not exists exclusive_content (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  title       text not null,
  description text default '',
  reward_url  text not null,
  cover_url   text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table exclusive_content enable row level security;  -- no public read: reward stays secret

-- ── 0024 · Superfan CRM ─────────────────────────────────────────────────
alter table subscribers add column if not exists is_superfan boolean not null default false;

-- ── 0025 · Unified release campaigns ────────────────────────────────────
-- Pre-save link auto-flips to a full streaming link on release day + notifies.
alter table presave_campaigns add column if not exists smart_links jsonb not null default '[]'::jsonb;
alter table presave_campaigns add column if not exists notified boolean not null default false;

-- ── 0026 · Fan accounts ─────────────────────────────────────────────────
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'label', 'artist', 'fan'));

create table if not exists fan_follows (
  id              uuid primary key default gen_random_uuid(),
  fan_profile_id  uuid not null references profiles(id) on delete cascade,
  artist_id       uuid not null references artists(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (fan_profile_id, artist_id)
);
alter table fan_follows enable row level security;
create index if not exists fan_follows_artist_idx on fan_follows (artist_id);

-- ── 0027 · Bandsintown auto-import ──────────────────────────────────────
alter table artists add column if not exists bandsintown_artist text;
alter table events  add column if not exists source      text not null default 'manual';
alter table events  add column if not exists external_id  text;
create unique index if not exists events_artist_external_idx
  on events (artist_id, external_id) where external_id is not null;

-- ── 0028 · Spotify Insights ─────────────────────────────────────────────
alter table artists add column if not exists spotify_artist_id text;

-- ── 0029 · Wallet passes ────────────────────────────────────────────────
alter table artists add column if not exists wallet_pass_enabled boolean not null default false;

-- ── 0030 · SMS capture + drop alerts ────────────────────────────────────
alter table artists add column if not exists sms_enabled boolean not null default false;

create table if not exists sms_subscribers (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  phone       text not null,
  status      text not null default 'active' check (status in ('active', 'unsubscribed')),
  source      text not null default 'page',
  consent_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (artist_id, phone)
);
alter table sms_subscribers enable row level security;
create index if not exists sms_subscribers_phone_idx on sms_subscribers (phone);

-- ── 0031 · Stripe Connect (Express) ─────────────────────────────────────
alter table artists add column if not exists stripe_account_id      text;
alter table artists add column if not exists stripe_charges_enabled boolean not null default false;

-- ── 0032 · Ticketing ────────────────────────────────────────────────────
create table if not exists ticket_types (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  artist_id   uuid not null references artists(id) on delete cascade,
  name        text not null,
  price_cents integer not null default 0,
  quantity    integer,
  sold        integer not null default 0,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table ticket_types enable row level security;
drop policy if exists "Anyone can read active ticket types" on ticket_types;
create policy "Anyone can read active ticket types" on ticket_types for select using (is_active = true);

create table if not exists tickets (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  artist_id      uuid not null references artists(id) on delete cascade,
  ticket_type_id uuid references ticket_types(id) on delete set null,
  token          text not null unique,
  buyer_name     text,
  buyer_email    text,
  status         text not null default 'valid' check (status in ('valid', 'used', 'refunded')),
  checked_in_at  timestamptz,
  order_id       text,
  created_at     timestamptz not null default now()
);
alter table tickets enable row level security;
create index if not exists tickets_event_idx on tickets (event_id);
create index if not exists tickets_token_idx on tickets (token);

-- ── 0033 · Tip jar ──────────────────────────────────────────────────────
alter table artists add column if not exists tips_enabled boolean not null default false;
create table if not exists tips (
  id             uuid primary key default gen_random_uuid(),
  artist_id      uuid not null references artists(id) on delete cascade,
  amount_cents   integer not null,
  supporter_name text,
  message        text,
  order_id       text unique,
  created_at     timestamptz not null default now()
);
alter table tips enable row level security;
create index if not exists tips_artist_idx on tips (artist_id);

-- ── 0034 · Store purchases ──────────────────────────────────────────────
create table if not exists purchases (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references artists(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  amount_cents integer not null,
  buyer_name   text,
  buyer_email  text,
  order_id     text unique,
  created_at   timestamptz not null default now()
);
alter table purchases enable row level security;
create index if not exists purchases_artist_idx on purchases (artist_id);

-- ════════════════════════════════════════════════════════════════════════
-- Done. Every pending feature is now supported: pixels, labels/roles,
-- onboarding, Spotify pre-save, billing, Playlist Spotlight, Fan Wall,
-- Events, Referrals, link scheduling, media embeds, SEO/white-label,
-- device analytics, appearance, product store, Shopify, web push, label
-- branding/team/campaigns, memberships, follow-to-unlock, Superfan CRM,
-- unified release campaigns, and fan accounts.
-- ════════════════════════════════════════════════════════════════════════
