import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistBySlug, getPublishedLinksForArtist, getActivePresavesForArtist, getCurrentProfile } from '@/lib/supabase/queries'
import { Music2, Globe, ExternalLink, Wallet } from 'lucide-react'
import type { Metadata } from 'next'
import { toMediaEmbed, deviceFromUA, fontFamilyFor, buttonRadiusFor } from '@/lib/utils'
import { fetchShopifyProducts, formatShopifyPrice } from '@/lib/shopify/storefront'
import { buildGoogleWalletSaveUrl } from '@/lib/wallet/google'
import StreamingButtons from './StreamingButtons'
import FanWall from './FanWall'
import DropAlerts from './DropAlerts'
import FollowButton from './FollowButton'
import SmsSignup from './SmsSignup'
import TipJar from './TipJar'
import BuyButton from './BuyButton'
import PixelScripts from '@/components/PixelScripts'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)
  if (!artist) return { title: 'Not Found' }
  const title = artist.seo_title?.trim() || `${artist.artist_name} | FlyLink`
  const description = artist.seo_description?.trim() || artist.bio || `Listen to ${artist.artist_name} on all platforms.`
  return {
    title,
    description,
    openGraph: { title, description, images: artist.avatar_url ? [artist.avatar_url] : [] },
  }
}

async function trackView(artistId: string) {
  const supabase = createAdminClient()
  const h = await headers()
  await supabase.from('analytics_events').insert({
    artist_id: artistId,
    event_type: 'view',
    country: h.get('x-vercel-ip-country') ?? null,
    device: deviceFromUA(h.get('user-agent')),
  })
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)
  if (!artist) notFound()

  const [links, presaves] = await Promise.all([
    getPublishedLinksForArtist(artist.id),
    getActivePresavesForArtist(artist.id),
  ])

  // Track view in background
  trackView(artist.id)

  const sections: { section: string; sort_order: number; is_visible: boolean }[] =
    (artist.artist_page_sections ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)

  const sectionVisible = (name: string) =>
    sections.find((s) => s.section === name)?.is_visible ?? true

  const bg = artist.background_type === 'color'
    ? { backgroundColor: artist.background_value ?? '#000000' }
    : artist.background_type === 'gradient'
    ? { backgroundImage: artist.background_value }
    : {}

  const pageStyle = { ...bg, fontFamily: fontFamilyFor(artist.font) }
  const radiusClass = buttonRadiusFor(artist.button_style)

  // Live merch from the artist's connected Shopify store.
  const shopifyProducts = artist.shopify_domain && artist.shopify_token
    ? await fetchShopifyProducts(artist.shopify_domain, artist.shopify_token)
    : []

  // Follow-to-unlock exclusives (reward_url is NEVER selected here — stays secret).
  const exclusives = (await createAdminClient()
    .from('exclusive_content')
    .select('id, title, description, cover_url, sort_order')
    .eq('artist_id', artist.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })).data ?? []

  // Follow state + follower count for the fan network.
  const admin = createAdminClient()
  const { count: followerCount } = await admin
    .from('fan_follows')
    .select('id', { count: 'exact', head: true })
    .eq('artist_id', artist.id)

  const viewerProfile = await getCurrentProfile()
  let isFollowing = false
  if (viewerProfile) {
    const { data: existingFollow } = await admin
      .from('fan_follows')
      .select('id')
      .eq('artist_id', artist.id)
      .eq('fan_profile_id', viewerProfile.id)
      .maybeSingle()
    isFollowing = !!existingFollow
  }

  // "Save to Google Wallet" link (null unless the artist enabled it AND Google
  // Wallet is configured on the platform).
  const walletUrl = artist.wallet_pass_enabled
    ? buildGoogleWalletSaveUrl({ id: artist.id, artist_name: artist.artist_name, slug: artist.slug, avatar_url: artist.avatar_url })
    : null

  // Active label-wide campaigns (cross-promo across the roster).
  const labelCampaigns = artist.label_id
    ? (await createAdminClient()
        .from('label_campaigns')
        .select('id, title, message, url, cover_url')
        .eq('label_id', artist.label_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })).data ?? []
    : []

  const socialIcons: Record<string, React.ElementType> = {
    website: Globe,
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center" style={pageStyle}>
      <PixelScripts
        metaPixelId={artist.meta_pixel_id}
        tiktokPixelId={artist.tiktok_pixel_id}
        gaMeasurementId={artist.ga_measurement_id}
      />
      <div className="w-full max-w-md mx-auto px-4 py-10 flex flex-col items-center gap-6">

        {/* Profile */}
        {sectionVisible('bio') && (
          <div className="flex flex-col items-center text-center gap-3">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt={artist.artist_name} className="w-24 h-24 rounded-full object-cover border-2 border-white/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-700 border-2 border-white/20 flex items-center justify-center">
                <Music2 className="w-10 h-10 text-zinc-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{artist.artist_name}</h1>
              {artist.bio && <p className="text-sm text-white/70 mt-1 max-w-xs leading-relaxed">{artist.bio}</p>}
            </div>
            {/* Social links */}
            {artist.social_links?.length > 0 && (
              <div className="flex items-center gap-3">
                {(artist.social_links as { platform: string; url: string }[]).map((sl) => {
                  const Icon = socialIcons[sl.platform] ?? Globe
                  return (
                    <a key={sl.platform} href={sl.url} target="_blank" rel="noopener noreferrer"
                      className="text-white/60 hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            )}
            {/* Follow (fan network) */}
            <FollowButton
              artistId={artist.id}
              signedIn={!!viewerProfile}
              initialFollowing={isFollowing}
              initialCount={followerCount ?? 0}
              radiusClass={radiusClass}
            />
            {/* Save to Google Wallet */}
            {walletUrl && (
              <a
                href={walletUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white text-xs font-semibold transition-colors hover:bg-white/15 ${radiusClass}`}
              >
                <Wallet className="w-4 h-4" />
                Save to Wallet
              </a>
            )}
          </div>
        )}

        {/* Label campaigns */}
        {labelCampaigns.length > 0 && (
          <div className="w-full space-y-2">
            {(labelCampaigns as { id: string; title: string; message: string; url: string | null; cover_url: string | null }[]).map((c) => {
              const inner = (
                <div className={`flex items-center gap-3 w-full bg-white/10 border border-yellow-400/30 ${radiusClass} p-3`}>
                  {c.cover_url ? (
                    <img src={c.cover_url} alt={c.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-yellow-400/15 flex items-center justify-center shrink-0"><Music2 className="w-5 h-5 text-yellow-400" /></div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider">{artist.labels?.name ?? 'Featured'}</p>
                    <p className="font-medium truncate">{c.title}</p>
                    {c.message && <p className="text-xs text-white/60 truncate">{c.message}</p>}
                  </div>
                  {c.url && <ExternalLink className="w-4 h-4 text-white/40 shrink-0" />}
                </div>
              )
              return c.url ? (
                <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">{inner}</a>
              ) : (
                <div key={c.id}>{inner}</div>
              )
            })}
          </div>
        )}

        {/* Drop alerts */}
        <DropAlerts slug={artist.slug} />

        {/* SMS drop alerts (opt-in) */}
        {artist.sms_enabled && (
          <SmsSignup slug={artist.slug} artistName={artist.artist_name} radiusClass={radiusClass} />
        )}

        {/* Tip jar (needs native payments; no external fallback) */}
        {artist.tips_enabled && artist.stripe_charges_enabled && (
          <TipJar artistId={artist.id} artistName={artist.artist_name} radiusClass={radiusClass} />
        )}

        {/* Pre-save campaigns */}
        {sectionVisible('presave') && presaves.length > 0 && (
          <div className="w-full space-y-3">
            {(presaves as { id: string; title: string; slug: string; cover_url?: string; release_date: string; save_count: number }[]).map((ps) => (
              <a key={ps.id} href={`/pre-save/${ps.slug}`}
                className="flex items-center gap-4 w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-colors">
                {ps.cover_url ? (
                  <img src={ps.cover_url} alt={ps.title} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                    <Music2 className="w-6 h-6 text-zinc-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-yellow-400 uppercase tracking-wider mb-0.5">Pre-Save</p>
                  <p className="font-semibold text-white truncate">{ps.title}</p>
                  <p className="text-xs text-white/50">
                    {new Date(ps.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* FlyLinks */}
        {sectionVisible('flylinks') && links.length > 0 && (
          <div className="w-full space-y-4">
            {(links as {
              id: string; title: string; cover_url?: string; artist_name: string;
              subtitle?: string; release_type: string;
              streaming_links: { platform: string; url: string }[]
            }[]).map((link) => (
              <div key={link.id} className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
                {/* Link header */}
                <div className="flex items-center gap-3 p-4">
                  {link.cover_url ? (
                    <img src={link.cover_url} alt={link.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                      <Music2 className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{link.title}</p>
                    <p className="text-sm text-white/60 truncate">{link.artist_name}</p>
                    {link.subtitle && <p className="text-xs text-white/40 truncate">{link.subtitle}</p>}
                  </div>
                </div>
                {/* Streaming buttons */}
                {link.streaming_links?.length > 0 && (
                  <StreamingButtons artistId={artist.id} promoLinkId={link.id} links={link.streaming_links} radiusClass={radiusClass} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Store */}
        {artist.products?.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider px-1">Store</p>
            {([...(artist.products as { id: string; title: string; price_cents: number; cover_url?: string; buy_url?: string; sort_order: number }[])]
              .sort((a, b) => a.sort_order - b.sort_order))
              .map((pr) => (
                <div key={pr.id} className={`flex items-center gap-3 w-full bg-white/10 border border-white/20 ${radiusClass} p-3`}>
                  {pr.cover_url ? (
                    <img src={pr.cover_url} alt={pr.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Music2 className="w-5 h-5 text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pr.title}</p>
                    <p className="text-xs text-white/60">{pr.price_cents > 0 ? `$${(pr.price_cents / 100).toFixed(2)}` : 'Free'}</p>
                  </div>
                  <BuyButton
                    productId={pr.id}
                    buyUrl={pr.buy_url ?? null}
                    nativeCheckout={!!artist.stripe_charges_enabled && pr.price_cents > 0}
                    className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors shrink-0 flex items-center justify-center min-w-[64px]"
                  />
                </div>
              ))}
          </div>
        )}

        {/* Follow-to-unlock exclusives */}
        {exclusives.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider px-1">Unlock</p>
            {(exclusives as { id: string; title: string; description: string; cover_url: string | null }[]).map((ex) => (
              <a key={ex.id} href={`/api/auth/spotify/start?type=unlock&id=${ex.id}`}
                className={`flex items-center gap-3 w-full bg-white/10 border border-white/20 ${radiusClass} p-3 hover:bg-white/15 transition-colors`}>
                {ex.cover_url ? (
                  <img src={ex.cover_url} alt={ex.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Music2 className="w-5 h-5 text-white/40" /></div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate">{ex.title}</p>
                  <p className="text-xs text-white/60">{ex.description || 'Connect Spotify to unlock'}</p>
                </div>
                <span className="text-xs font-semibold text-black bg-[#1DB954] rounded-full px-3 py-1.5 shrink-0">Unlock</span>
              </a>
            ))}
          </div>
        )}

        {/* Membership */}
        {artist.membership_tiers?.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider px-1">Membership</p>
            {([...(artist.membership_tiers as { id: string; name: string; price_cents: number; interval: string; description: string; perks: string[]; join_url: string | null; sort_order: number }[])]
              .sort((a, b) => a.sort_order - b.sort_order))
              .map((t) => (
                <div key={t.id} className={`w-full bg-white/10 border border-white/20 ${radiusClass} p-4`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-white/70">
                      {t.price_cents > 0 ? `$${(t.price_cents / 100).toFixed(2)}` : 'Free'}<span className="text-white/40">/{t.interval === 'year' ? 'yr' : 'mo'}</span>
                    </p>
                  </div>
                  {t.description && <p className="text-xs text-white/60 mb-2">{t.description}</p>}
                  {t.perks?.length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {t.perks.map((p, i) => <li key={i} className="text-xs text-white/70 flex gap-1.5"><span className="text-[#1DB954]">✓</span>{p}</li>)}
                    </ul>
                  )}
                  {t.join_url && (
                    <a href={t.join_url} target="_blank" rel="noopener noreferrer"
                      className="block w-full text-center py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors">
                      Join
                    </a>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Merch (live from Shopify) */}
        {shopifyProducts.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider px-1">Merch</p>
            <div className="grid grid-cols-2 gap-2">
              {shopifyProducts.map((pr) => (
                <a key={pr.id} href={pr.url} target="_blank" rel="noopener noreferrer"
                  className={`bg-white/10 border border-white/20 ${radiusClass} overflow-hidden hover:bg-white/15 transition-colors`}>
                  {pr.image ? (
                    <img src={pr.image} alt={pr.title} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-white/10 flex items-center justify-center"><Music2 className="w-6 h-6 text-white/30" /></div>
                  )}
                  <div className="p-2.5">
                    <p className="text-sm font-medium truncate">{pr.title}</p>
                    <p className="text-xs text-white/60">{formatShopifyPrice(pr.price, pr.currency)}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Custom links */}
        {sectionVisible('custom_links') && artist.custom_links?.length > 0 && (
          <div className="w-full space-y-2">
            {(artist.custom_links as { id: string; label: string; url: string }[]).map((cl) => (
              <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center justify-between w-full bg-white/10 border border-white/20 ${radiusClass} px-5 py-3.5 hover:bg-white/15 transition-colors`}>
                <span className="font-medium">{cl.label}</span>
                <ExternalLink className="w-4 h-4 text-white/40" />
              </a>
            ))}
          </div>
        )}

        {/* Media players */}
        {artist.media_embeds?.length > 0 && (
          <div className="w-full space-y-3">
            {([...(artist.media_embeds as { id: string; url: string; sort_order: number }[])]
              .sort((a, b) => a.sort_order - b.sort_order))
              .map((m) => {
                const em = toMediaEmbed(m.url)
                if (!em) return null
                return (
                  <div key={m.id} className="w-full overflow-hidden rounded-2xl">
                    {em.aspect ? (
                      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                        <iframe src={em.src} className="absolute inset-0 w-full h-full" style={{ border: 0 }} loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
                      </div>
                    ) : (
                      <iframe src={em.src} width="100%" height={em.height} style={{ border: 0 }} loading="lazy" allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture" />
                    )}
                  </div>
                )
              })}
          </div>
        )}

        {/* Playlist Spotlight */}
        {artist.playlist_spotlights?.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider px-1">Playlists</p>
            {(artist.playlist_spotlights as { id: string; title: string; spotify_url: string; cover_url?: string }[]).map((pl) => (
              <a key={pl.id} href={pl.spotify_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 hover:bg-white/15 transition-colors">
                {pl.cover_url ? (
                  <img src={pl.cover_url} alt={pl.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#1DB954]/20 flex items-center justify-center shrink-0">
                    <Music2 className="w-5 h-5 text-[#1DB954]" />
                  </div>
                )}
                <span className="font-medium flex-1 truncate">{pl.title}</span>
                <ExternalLink className="w-4 h-4 text-white/40" />
              </a>
            ))}
          </div>
        )}

        {/* Fan Wall */}
        {artist.fan_wall_enabled && (
          <FanWall slug={artist.slug} notes={artist.fan_wall_notes ?? []} />
        )}

        {/* Footer — label branding, else FlyLink (hidden on white-label plans) */}
        {artist.labels ? (
          <div className="mt-4 flex items-center gap-1.5 text-white/40 text-xs">
            {artist.labels.logo_url ? (
              <img src={artist.labels.logo_url} alt={artist.labels.name} className="h-4 w-4 rounded object-cover" />
            ) : (
              <Music2 className="w-3 h-3" />
            )}
            <span>Powered by {artist.labels.name}</span>
          </div>
        ) : !(artist.hide_branding && ['pro', 'label', 'signed', 'enterprise'].includes(artist.profiles?.plan)) ? (
          <div className="mt-4 flex items-center gap-1.5 text-white/30 text-xs">
            <Music2 className="w-3 h-3" />
            <span>Powered by FlyLink</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
