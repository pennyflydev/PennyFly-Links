-- Performance: index the hot foreign keys we filter on constantly. Postgres
-- does NOT auto-index foreign keys, so these were sequential scans. Tables that
-- already have a unique(artist_id, …) constraint (promo_links, subscribers,
-- presave_campaigns, artist_page_sections, sms_subscribers) get artist_id
-- coverage from that index's leftmost column and are intentionally omitted.

-- analytics_events grows fastest and is counted on every dashboard/roster/HQ load.
create index if not exists analytics_events_artist_type_idx on analytics_events (artist_id, event_type);

-- streaming_links are joined for every public artist page (per promo link).
create index if not exists streaming_links_promo_idx on streaming_links (promo_link_id);

-- Content tables joined/filtered by artist_id (public page + dashboards).
create index if not exists events_artist_idx on events (artist_id);
create index if not exists custom_links_artist_idx on custom_links (artist_id);
create index if not exists social_links_artist_idx on social_links (artist_id);
create index if not exists media_embeds_artist_idx on media_embeds (artist_id);
create index if not exists playlist_spotlights_artist_idx on playlist_spotlights (artist_id);
create index if not exists fan_wall_notes_artist_idx on fan_wall_notes (artist_id);
create index if not exists products_artist_idx on products (artist_id);
create index if not exists membership_tiers_artist_idx on membership_tiers (artist_id);
create index if not exists exclusive_content_artist_idx on exclusive_content (artist_id);
