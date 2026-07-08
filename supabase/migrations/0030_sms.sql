-- SMS capture + drop alerts. Fans opt in with explicit consent; artists text
-- their list via Twilio. Run this in the Supabase SQL editor.

alter table artists add column if not exists sms_enabled boolean not null default false;

create table if not exists sms_subscribers (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references artists(id) on delete cascade,
  phone       text not null,                        -- E.164, e.g. +15551234567
  status      text not null default 'active' check (status in ('active', 'unsubscribed')),
  source      text not null default 'page',
  consent_at  timestamptz not null default now(),   -- when the fan gave consent
  created_at  timestamptz not null default now(),
  unique (artist_id, phone)
);
alter table sms_subscribers enable row level security;
-- No public read policy: managed via the admin client, scoped by app code.
create index if not exists sms_subscribers_phone_idx on sms_subscribers (phone);
