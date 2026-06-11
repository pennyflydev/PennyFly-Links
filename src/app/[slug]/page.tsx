import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistBySlug, getPublishedLinksForArtist, getActivePresavesForArtist } from '@/lib/supabase/queries'
import { Music2, Globe, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import StreamingButtons from './StreamingButtons'
import PixelScripts from './PixelScripts'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtistBySlug(slug)
  if (!artist) return { title: 'Not Found' }
  return {
    title: `${artist.artist_name} | FlyLink`,
    description: artist.bio || `Listen to ${artist.artist_name} on all platforms.`,
    openGraph: { images: artist.avatar_url ? [artist.avatar_url] : [] },
  }
}

async function trackView(artistId: string) {
  const supabase = createAdminClient()
  await supabase.from('analytics_events').insert({ artist_id: artistId, event_type: 'view' })
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

  const socialIcons: Record<string, React.ElementType> = {
    website: Globe,
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center" style={bg}>
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
          </div>
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
                  <StreamingButtons artistId={artist.id} promoLinkId={link.id} links={link.streaming_links} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom links */}
        {sectionVisible('custom_links') && artist.custom_links?.length > 0 && (
          <div className="w-full space-y-2">
            {(artist.custom_links as { id: string; label: string; url: string }[]).map((cl) => (
              <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 hover:bg-white/15 transition-colors">
                <span className="font-medium">{cl.label}</span>
                <ExternalLink className="w-4 h-4 text-white/40" />
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center gap-1.5 text-white/30 text-xs">
          <Music2 className="w-3 h-3" />
          <span>Powered by FlyLink</span>
        </div>
      </div>
    </div>
  )
}
