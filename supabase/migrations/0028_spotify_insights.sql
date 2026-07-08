-- Spotify Insights: store the artist's Spotify artist id so we can pull their
-- public metrics (followers, popularity, top tracks) into analytics.
-- Run this in the Supabase SQL editor.

alter table artists add column if not exists spotify_artist_id text;
