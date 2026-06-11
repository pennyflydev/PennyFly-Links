-- Adds marketing pixel / analytics IDs to artists.
-- Run this in the Supabase SQL editor.

alter table artists add column if not exists meta_pixel_id      text;
alter table artists add column if not exists tiktok_pixel_id    text;
alter table artists add column if not exists ga_measurement_id  text;
