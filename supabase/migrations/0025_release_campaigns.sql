-- Unified release campaigns: a pre-save link auto-flips into a full
-- multi-platform streaming link on release day, and fans get notified.
-- Run this in the Supabase SQL editor.

-- Cached streaming links (resolved from Odesli once the release is out),
-- so the flipped page doesn't hit Odesli on every load.
alter table presave_campaigns add column if not exists smart_links jsonb not null default '[]'::jsonb;

-- Whether the "out now" drop alert has already been sent (release-day cron).
alter table presave_campaigns add column if not exists notified boolean not null default false;
