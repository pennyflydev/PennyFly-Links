-- FlyLink Database Schema
-- Run this in your Supabase SQL editor to set up all tables

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES
-- One row per Clerk user. Mirrors Clerk userId.
-- ─────────────────────────────────────────────
create table profiles (
  id           uuid primary key default uuid_generate_v4(),
  clerk_id     text unique not null,
  email        text not null,
  role         text not null default 'artist' check (role in ('admin', 'label', 'artist')),
  plan         text not null default 'starter' check (plan in ('signed', 'starter', 'pro', 'label', 'enterprise')),
  onboarded    boolean not null default false,
  stripe_customer_id    text,
  stripe_subscription_id text,
  subscription_status   text,
  current_period_end    timestamptz,
  referral_code         text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid()::text = clerk_id);
create policy "Users can update own profile" on profiles for update using (auth.uid()::text = clerk_id);

-- ─────────────────────────────────────────────
-- LABELS
-- An account that owns/manages a roster of artists
-- ─────────────────────────────────────────────
create table labels (
  id                uuid primary key default uuid_generate_v4(),
  owner_profile_id  uuid not null references profiles(id) on delete cascade,
  name              text not null default '',
  created_at        timestamptz not null default now()
);
alter table labels enable row level security;

-- ─────────────────────────────────────────────
-- ARTISTS
-- Public-facing artist page config per profile
-- ─────────────────────────────────────────────
create table artists (
  id               uuid primary key default uuid_generate_v4(),
  profile_id       uuid not null references profiles(id) on delete cascade,
  label_id         uuid references labels(id) on delete set null,
  artist_name      text not null default '',
  slug             text unique not null,
  bio              text default '',
  genres           text[] default '{}',
  avatar_url       text,
  cover_url        text,
  theme            text not null default 'minimal' check (theme in ('minimal', 'bold', 'elegant', 'neon')),
  background_type  text not null default 'color' check (background_type in ('color', 'gradient', 'image')),
  background_value text default '#000000',
  custom_domain    text unique,
  subdomain        text unique,
  is_signed        boolean not null default false,
  meta_pixel_id      text,
  tiktok_pixel_id    text,
  ga_measurement_id  text,
  fan_wall_enabled   boolean not null default false,
  seo_title          text,
  seo_description    text,
  hide_branding      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table artists enable row level security;
create policy "Anyone can read artists" on artists for select using (true);
create policy "Artists can update own record" on artists for update using (
  profile_id in (select id from profiles where clerk_id = auth.uid()::text)
);

-- ─────────────────────────────────────────────
-- SOCIAL LINKS
-- ─────────────────────────────────────────────
create table social_links (
  id         uuid primary key default uuid_generate_v4(),
  artist_id  uuid not null references artists(id) on delete cascade,
  platform   text not null,
  url        text not null,
  sort_order integer not null default 0
);

alter table social_links enable row level security;
create policy "Anyone can read social links" on social_links for select using (true);
create policy "Artist can manage own social links" on social_links for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- PROMO LINKS
-- A "FlyLink" — one release with multiple streaming links
-- ─────────────────────────────────────────────
create table promo_links (
  id            uuid primary key default uuid_generate_v4(),
  artist_id     uuid not null references artists(id) on delete cascade,
  title         text not null,
  slug          text not null,
  artist_name   text not null default '',
  subtitle      text default '',
  release_type  text not null default 'single' check (release_type in ('single', 'album', 'ep')),
  cover_url     text,
  is_published  boolean not null default false,
  publish_at    timestamptz,
  expires_at    timestamptz,
  view_count    integer not null default 0,
  click_count   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (artist_id, slug)
);

alter table promo_links enable row level security;
create policy "Anyone can read published promo links" on promo_links for select using (is_published = true);
create policy "Artist can read own promo links" on promo_links for select using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);
create policy "Artist can manage own promo links" on promo_links for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- STREAMING LINKS
-- Platform URLs for a promo link
-- ─────────────────────────────────────────────
create table streaming_links (
  id            uuid primary key default uuid_generate_v4(),
  promo_link_id uuid not null references promo_links(id) on delete cascade,
  platform      text not null check (platform in ('spotify','apple_music','youtube_music','tidal','amazon_music','deezer','bandcamp','soundcloud')),
  url           text not null,
  click_count   integer not null default 0,
  sort_order    integer not null default 0
);

alter table streaming_links enable row level security;
create policy "Anyone can read streaming links" on streaming_links for select using (true);
create policy "Artist can manage own streaming links" on streaming_links for all using (
  promo_link_id in (
    select pl.id from promo_links pl
    join artists a on a.id = pl.artist_id
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- PRESAVE CAMPAIGNS
-- ─────────────────────────────────────────────
create table presave_campaigns (
  id               uuid primary key default uuid_generate_v4(),
  artist_id        uuid not null references artists(id) on delete cascade,
  title            text not null,
  slug             text not null,
  cover_url        text,
  release_date     date not null,
  spotify_url      text,
  description      text default '',
  show_fan_count   boolean not null default true,
  is_active        boolean not null default true,
  save_count       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (artist_id, slug)
);

alter table presave_campaigns enable row level security;
create policy "Anyone can read active campaigns" on presave_campaigns for select using (is_active = true);
create policy "Artist can manage own campaigns" on presave_campaigns for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- SUBSCRIBERS
-- Fans who gave their email via pre-save or email capture
-- ─────────────────────────────────────────────
create table subscribers (
  id            uuid primary key default uuid_generate_v4(),
  artist_id     uuid not null references artists(id) on delete cascade,
  email         text not null,
  name          text,
  source        text not null default 'email_capture' check (source in ('presave', 'email_capture', 'imported')),
  source_id     uuid,
  spotify_id    text,
  country       text,
  synced_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (artist_id, email)
);

alter table subscribers enable row level security;
create policy "Artist can manage own subscribers" on subscribers for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- EMAIL INTEGRATIONS
-- AWeber / Mailchimp / Klaviyo connection per artist
-- ─────────────────────────────────────────────
create table email_integrations (
  id            uuid primary key default uuid_generate_v4(),
  artist_id     uuid not null references artists(id) on delete cascade,
  provider      text not null check (provider in ('aweber', 'mailchimp', 'klaviyo')),
  access_token  text,
  refresh_token text,
  token_expires_at timestamptz,
  list_id       text,
  list_name     text,
  is_active     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (artist_id, provider)
);

alter table email_integrations enable row level security;
create policy "Artist can manage own integrations" on email_integrations for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- ANALYTICS EVENTS
-- Click/view events per link
-- ─────────────────────────────────────────────
create table analytics_events (
  id            uuid primary key default uuid_generate_v4(),
  artist_id     uuid not null references artists(id) on delete cascade,
  event_type    text not null check (event_type in ('view', 'click')),
  promo_link_id uuid references promo_links(id) on delete set null,
  platform      text,
  referrer      text,
  country       text,
  created_at    timestamptz not null default now()
);

alter table analytics_events enable row level security;
create policy "Artist can read own analytics" on analytics_events for select using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);
create policy "Anyone can insert analytics" on analytics_events for insert with check (true);

-- ─────────────────────────────────────────────
-- ARTIST INVITES
-- Label sends invite links to artists
-- ─────────────────────────────────────────────
create table artist_invites (
  id          uuid primary key default uuid_generate_v4(),
  token       text unique not null default encode(gen_random_bytes(24), 'hex'),
  email       text not null,
  invited_by  uuid not null references profiles(id),
  label_id    uuid references labels(id) on delete cascade,
  claimed_by  uuid references profiles(id),
  claimed_at  timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);

alter table artist_invites enable row level security;
create policy "Admin can manage invites" on artist_invites for all using (
  (select role from profiles where clerk_id = auth.uid()::text) = 'admin'
);
create policy "Anyone can read invite by token" on artist_invites for select using (true);

-- ─────────────────────────────────────────────
-- ARTIST PAGE SECTIONS
-- Drag-and-drop section order + visibility per artist
-- ─────────────────────────────────────────────
create table artist_page_sections (
  id         uuid primary key default uuid_generate_v4(),
  artist_id  uuid not null references artists(id) on delete cascade,
  section    text not null check (section in ('bio','flylinks','presave','custom_links','email_capture')),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  unique (artist_id, section)
);

alter table artist_page_sections enable row level security;
create policy "Anyone can read page sections" on artist_page_sections for select using (true);
create policy "Artist can manage own sections" on artist_page_sections for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- CUSTOM LINKS
-- Arbitrary links on an artist page (merch, website, etc.)
-- ─────────────────────────────────────────────
create table custom_links (
  id         uuid primary key default uuid_generate_v4(),
  artist_id  uuid not null references artists(id) on delete cascade,
  label      text not null,
  url        text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table custom_links enable row level security;
create policy "Anyone can read custom links" on custom_links for select using (true);
create policy "Artist can manage own custom links" on custom_links for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- REFERRALS
-- ─────────────────────────────────────────────
create table referrals (
  id                  uuid primary key default uuid_generate_v4(),
  referrer_profile_id uuid not null references profiles(id) on delete cascade,
  referred_profile_id uuid unique references profiles(id) on delete cascade,
  referred_email      text,
  status              text not null default 'signed_up',
  created_at          timestamptz not null default now()
);
alter table referrals enable row level security;

-- ─────────────────────────────────────────────
-- EVENTS
-- Gig / launch landing pages with countdown + ticket link
-- ─────────────────────────────────────────────
create table events (
  id           uuid primary key default uuid_generate_v4(),
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
create policy "Anyone can read published events" on events for select using (is_published = true);
create policy "Artist can manage own events" on events for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- FAN WALL NOTES
-- Fans leave notes on the artist page; artist pins / removes
-- ─────────────────────────────────────────────
create table fan_wall_notes (
  id          uuid primary key default uuid_generate_v4(),
  artist_id   uuid not null references artists(id) on delete cascade,
  name        text not null default '',
  message     text not null,
  is_pinned   boolean not null default false,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table fan_wall_notes enable row level security;
create policy "Anyone can read approved notes" on fan_wall_notes for select using (is_approved = true);
create policy "Artist can manage own notes" on fan_wall_notes for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- PLAYLIST SPOTLIGHTS
-- Curated Spotify playlist deep-links on the artist page
-- ─────────────────────────────────────────────
create table playlist_spotlights (
  id          uuid primary key default uuid_generate_v4(),
  artist_id   uuid not null references artists(id) on delete cascade,
  title       text not null default '',
  spotify_url text not null,
  cover_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table playlist_spotlights enable row level security;
create policy "Anyone can read playlist spotlights" on playlist_spotlights for select using (true);
create policy "Artist can manage own playlist spotlights" on playlist_spotlights for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- MEDIA EMBEDS
-- Live Spotify/YouTube/Apple/SoundCloud players on the artist page
-- ─────────────────────────────────────────────
create table media_embeds (
  id         uuid primary key default uuid_generate_v4(),
  artist_id  uuid not null references artists(id) on delete cascade,
  url        text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table media_embeds enable row level security;
create policy "Anyone can read media embeds" on media_embeds for select using (true);
create policy "Artist can manage own media embeds" on media_embeds for all using (
  artist_id in (
    select a.id from artists a
    join profiles p on p.id = a.profile_id
    where p.clerk_id = auth.uid()::text
  )
);

-- ─────────────────────────────────────────────
-- SPOTIFY PRE-SAVE AUTHORIZATIONS
-- A fan's stored Spotify auth so the release-day job can save the drop
-- ─────────────────────────────────────────────
create table spotify_presave_authorizations (
  id              uuid primary key default uuid_generate_v4(),
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

-- ─────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger artists_updated_at before update on artists for each row execute function update_updated_at();
create trigger promo_links_updated_at before update on promo_links for each row execute function update_updated_at();
create trigger presave_campaigns_updated_at before update on presave_campaigns for each row execute function update_updated_at();
create trigger email_integrations_updated_at before update on email_integrations for each row execute function update_updated_at();
