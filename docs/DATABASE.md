# Database reference

Postgres on Supabase. **`supabase/schema.sql` is the consolidated source of truth** for a fresh database; `supabase/migrations/00NN_*.sql` are incremental upgrades, and `supabase/RUN_ALL_pending_migrations.sql` is an idempotent combined block for upgrading an existing database in one paste.

## RLS posture (read this first)

Every table has **RLS enabled**. But because auth is Clerk (not Supabase), server code uses the **service-role admin client, which bypasses RLS** — access is enforced in app code by scoping queries to the current artist/label. RLS only governs the **public anon path** (the public artist page). So:

- **Public-read tables** carry a `for select using (is_published/is_active/true)` policy → visible to anon.
- **Private tables** (subscribers, `sms_subscribers`, `tickets`, `spotify_presave_authorizations`, `email_integrations`, `fan_follows`, `referrals`, label tables, `push_subscriptions`) have RLS enabled with **no** public policy → only the admin client can read them.
- **`exclusive_content`** deliberately has no public read policy so `reward_url` stays secret.

## Tables

Grouped by area. `→` = foreign key. All PKs are `uuid`. Timestamps default `now()`.

### Identity & tenancy
| Table | Purpose | Key columns | RLS |
|---|---|---|---|
| **profiles** | one row per Clerk user | `clerk_id` (uniq), `email`, `role` (admin/label/artist/fan), `plan`, `onboarded`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `current_period_end`, `referral_code` (uniq) | own-row select/update only |
| **artists** | public artist page config (1 per profile) | `profile_id`→profiles, `label_id`→labels, `slug` (uniq), `artist_name`, `bio`, `theme`, `background_*`, `custom_domain`/`subdomain` (uniq), `is_signed`, pixels, SEO, `font`/`button_style`, `shopify_*`, `bandsintown_artist`, `spotify_artist_id`, `wallet_pass_enabled`, `sms_enabled`, `stripe_account_id`, `stripe_charges_enabled` | **public read (`using (true)`)**; owner update |
| **labels** | account owning a roster | `owner_profile_id`→profiles, `name`, `logo_url`, `accent_color` | admin/service-role only |
| **label_members** | team members | `label_id`→labels, `profile_id`→profiles, `member_role` (manager/viewer), uniq(label,profile) | admin/service-role only |
| **label_member_invites** | pending team invites | `label_id`, `email`, `member_role`, `claimed_by`, `expires_at` (+14d) | admin/service-role only |
| **artist_invites** | invite links to claim an artist account | `token` (uniq), `email`, `invited_by`→profiles, `label_id`→labels, `claimed_by`, `expires_at` (+7d) | admin manage; **public read** (lookup by token) |

### Artist page content
| Table | Purpose | Key columns | RLS |
|---|---|---|---|
| **artist_page_sections** | section order/visibility | `artist_id`, `section` (bio/flylinks/presave/custom_links/email_capture), `is_visible`, `sort_order`, uniq(artist,section) | public read; owner manage |
| **social_links** | social icons | `artist_id`, `platform`, `url`, `sort_order` | public read; owner manage |
| **custom_links** | arbitrary buttons | `artist_id`, `label`, `url`, `sort_order` | public read; owner manage |
| **promo_links** | a "FlyLink" (release smart link) | `artist_id`, `slug`, `title`, `release_type`, `is_published`, `publish_at`, `expires_at`, `view_count`, `click_count`, uniq(artist,slug) | public read of published; owner all |
| **streaming_links** | per-platform URLs for a promo link | `promo_link_id`→promo_links, `platform` (enum), `url`, `click_count` | public read; owner manage |
| **playlist_spotlights** | Spotify playlist deep-links | `artist_id`, `title`, `spotify_url`, `cover_url` | public read; owner manage |
| **media_embeds** | live players | `artist_id`, `url`, `sort_order` | public read; owner manage |
| **fan_wall_notes** | fan notes on page | `artist_id`, `name`, `message`, `is_pinned`, `is_approved` | public read of approved; owner manage |

### Campaigns & fans
| Table | Purpose | Key columns | RLS |
|---|---|---|---|
| **presave_campaigns** | pre-save landing pages | `artist_id`, `slug`, `release_date`, `spotify_url`, `save_count`, `smart_links` (jsonb), `notified`, uniq(artist,slug) | public read of active; owner all |
| **spotify_presave_authorizations** | stored fan refresh tokens for release-day saves | `campaign_id`, `artist_id`, `spotify_user_id`, `refresh_token`, `target_type`/`target_id`, `fulfilled`, uniq(campaign,user) | admin/service-role only |
| **subscribers** | captured fan emails (CRM) | `artist_id`, `email`, `name`, `source` (presave/email_capture/imported), `spotify_id`, `country`, `is_superfan`, `synced_at`, uniq(artist,email) | owner only (private) |
| **fan_follows** | fan→artist follows | `fan_profile_id`→profiles, `artist_id`, uniq, idx(artist) | admin/service-role only |
| **sms_subscribers** | consented SMS opt-ins | `artist_id`, `phone`, `status` (active/unsubscribed), `consent_at`, uniq(artist,phone), idx(phone) | admin/service-role only |
| **push_subscriptions** | web-push endpoints | `artist_id`, `endpoint`, `p256dh`, `auth`, uniq(artist,endpoint) | admin/service-role only |
| **email_integrations** | AWeber/Mailchimp/Klaviyo tokens | `artist_id`, `provider`, `access_token`, `list_id`, uniq(artist,provider) | owner only *(feature not wired in code yet)* |
| **referrals** | who each referrer brought in | `referrer_profile_id`, `referred_profile_id` (uniq), `status` | admin/service-role only |
| **analytics_events** | raw view/click events | `artist_id`, `event_type` (view/click), `promo_link_id`, `platform`, `country`, `device` | owner select; **anyone insert** |

### Commerce & events
| Table | Purpose | Key columns | RLS |
|---|---|---|---|
| **products** | digital store | `artist_id`, `title`, `price_cents`, `buy_url`, `is_published`, `sort_order` | public read of published; owner all |
| **membership_tiers** | paid fan memberships | `artist_id`, `name`, `price_cents`, `interval` (month/year), `perks` (text[]), `join_url`, `is_active` | public read of active; owner manage |
| **exclusive_content** | follow-to-unlock rewards | `artist_id`, `title`, `reward_url` (secret), `is_active` | **no public read** (reward hidden) |
| **label_campaigns** | cross-roster promo cards | `label_id`, `title`, `message`, `url`, `is_active` | public read of active |
| **events** | gig/launch landing pages | `artist_id`, `slug` (uniq), `start_at`, `venue`, `city`, `ticket_url`, `is_published`, `source` (manual/bandsintown), `external_id`; partial uniq(artist,external_id) | public read of published; owner all |
| **ticket_types** | ticket tiers for an event | `event_id`, `artist_id`, `name`, `price_cents`, `quantity` (null=∞), `sold`, `is_active`, `sort_order` | public read of active; owner via service role |
| **tickets** | issued tickets (single-scan QR) | `event_id`, `artist_id`, `ticket_type_id`, `token` (uniq), `buyer_name`, `buyer_email`, `status` (valid/used/refunded), `checked_in_at`, `order_id`; idx(event), idx(token) | admin/service-role only |

## Migrations (0002 → 0032)

`RUN_ALL_pending_migrations.sql` combines all of these idempotently — run it once to upgrade an existing DB. (Its header comment says "0002 → 0026" but the body goes through **0032**; trust the body.)

| # | Adds |
|---|---|
| 0002 | `artists` marketing pixels (meta/tiktok/ga) |
| 0003 | `label` role; `labels` table; `artists.label_id`, `artist_invites.label_id` |
| 0004 | `profiles.onboarded` (backfilled true) |
| 0005 | `spotify_presave_authorizations` |
| 0006 | `profiles.subscription_status`, `current_period_end` (billing) |
| 0007 | `playlist_spotlights` (public read) |
| 0008 | `artists.fan_wall_enabled`; `fan_wall_notes` |
| 0009 | `events` |
| 0010 | `profiles.referral_code`; `referrals` |
| 0011 | `promo_links.publish_at`, `expires_at` (scheduling) |
| 0012 | `media_embeds` |
| 0013 | `artists` SEO + `hide_branding` |
| 0014 | `analytics_events.device` |
| 0015 | `artists.font`, `button_style` |
| 0016 | `products` (digital store) |
| 0017 | `artists.shopify_domain`, `shopify_token` |
| 0018 | `push_subscriptions` |
| 0019 | `labels.logo_url`, `accent_color` |
| 0020 | `label_members`, `label_member_invites` |
| 0021 | `label_campaigns` |
| 0022 | `membership_tiers` |
| 0023 | `exclusive_content` (no public read) |
| 0024 | `subscribers.is_superfan` |
| 0025 | `presave_campaigns.smart_links` (jsonb), `notified` |
| 0026 | `fan` role; `fan_follows` |
| 0027 | `artists.bandsintown_artist`; `events.source`, `external_id` |
| 0028 | `artists.spotify_artist_id` |
| 0029 | `artists.wallet_pass_enabled` |
| 0030 | `artists.sms_enabled`; `sms_subscribers` |
| 0031 | `artists.stripe_account_id`, `stripe_charges_enabled` |
| 0032 | `ticket_types`, `tickets` |

> **Next migration = 0033.** Add the file, append to `RUN_ALL_pending_migrations.sql`, and mirror into `schema.sql`.
