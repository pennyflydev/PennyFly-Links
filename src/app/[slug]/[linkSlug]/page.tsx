import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Music2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import StreamingButtons from '../StreamingButtons'
import PixelScripts from '@/components/PixelScripts'

async function getRelease(artistSlug: string, linkSlug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('promo_links')
    .select('*, streaming_links(*), artists!inner(id, artist_name, slug, avatar_url, meta_pixel_id, tiktok_pixel_id, ga_measurement_id)')
    .eq('slug', linkSlug)
    .eq('is_published', true)
    .eq('artists.slug', artistSlug)
    .single()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; linkSlug: string }>
}): Promise<Metadata> {
  const { slug, linkSlug } = await params
  const release = await getRelease(slug, linkSlug)
  if (!release) return { title: 'Not Found' }
  return {
    title: `${release.title} — ${release.artist_name} | FlyLink`,
    description: release.subtitle || `Listen to ${release.title} by ${release.artist_name} on every platform.`,
    openGraph: { images: release.cover_url ? [release.cover_url] : [] },
  }
}

async function trackView(artistId: string, promoLinkId: string) {
  const supabase = createAdminClient()
  const country = (await headers()).get('x-vercel-ip-country') ?? null
  supabase
    .from('analytics_events')
    .insert({ artist_id: artistId, event_type: 'view', promo_link_id: promoLinkId, country })
    .then(async () => {
      const { data } = await supabase.from('promo_links').select('view_count').eq('id', promoLinkId).single()
      if (data) await supabase.from('promo_links').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', promoLinkId)
    })
}

export default async function ReleasePage({
  params,
}: {
  params: Promise<{ slug: string; linkSlug: string }>
}) {
  const { slug, linkSlug } = await params
  const release = await getRelease(slug, linkSlug)
  if (!release) notFound()

  const artist = release.artists as {
    id: string; artist_name: string; slug: string; avatar_url: string | null
    meta_pixel_id: string | null; tiktok_pixel_id: string | null; ga_measurement_id: string | null
  }

  trackView(artist.id, release.id)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <PixelScripts
        metaPixelId={artist.meta_pixel_id}
        tiktokPixelId={artist.tiktok_pixel_id}
        gaMeasurementId={artist.ga_measurement_id}
      />
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        {release.cover_url ? (
          <img src={release.cover_url} alt={release.title} className="w-60 h-60 rounded-2xl object-cover shadow-2xl" />
        ) : (
          <div className="w-60 h-60 rounded-2xl bg-zinc-800 flex items-center justify-center shadow-2xl">
            <Music2 className="w-16 h-16 text-zinc-600" />
          </div>
        )}

        <div>
          {release.subtitle && (
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-[0.2em] mb-2">{release.subtitle}</p>
          )}
          <h1 className="text-3xl font-bold">{release.title}</h1>
          <p className="text-zinc-400 mt-1">{release.artist_name}</p>
        </div>

        {release.streaming_links?.length > 0 ? (
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden pt-2">
            <StreamingButtons artistId={artist.id} promoLinkId={release.id} links={release.streaming_links} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No streaming links yet.</p>
        )}

        <Link href={`/${artist.slug}`} className="text-sm text-zinc-500 hover:text-white transition-colors">
          More from {artist.artist_name} →
        </Link>

        <div className="mt-2 flex items-center gap-1.5 text-zinc-600 text-xs">
          <Music2 className="w-3 h-3" />
          <span>Powered by FlyLink</span>
        </div>
      </div>
    </div>
  )
}
