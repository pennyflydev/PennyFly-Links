import { notFound } from 'next/navigation'
import { Music2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import StreamingButtons from '../../../[slug]/StreamingButtons'

async function getRelease(artistSlug: string, linkSlug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('promo_links')
    .select('*, streaming_links(*), artists!inner(id, artist_name, slug)')
    .eq('slug', linkSlug)
    .eq('is_published', true)
    .eq('artists.slug', artistSlug)
    .single()
  return data
}

// Compact, framable widget an artist can embed on their own site.
export default async function EmbedRelease({
  params,
}: {
  params: Promise<{ slug: string; linkSlug: string }>
}) {
  const { slug, linkSlug } = await params
  const release = await getRelease(slug, linkSlug)
  if (!release) notFound()

  const artist = release.artists as { id: string; artist_name: string; slug: string }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-4">
        {release.cover_url ? (
          <img src={release.cover_url} alt={release.title} className="w-32 h-32 rounded-xl object-cover shadow-lg" />
        ) : (
          <div className="w-32 h-32 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Music2 className="w-10 h-10 text-zinc-600" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold leading-tight">{release.title}</h1>
          <p className="text-sm text-white/60">{release.artist_name}</p>
        </div>

        {release.streaming_links?.length > 0 && (
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden pt-2">
            <StreamingButtons artistId={artist.id} promoLinkId={release.id} links={release.streaming_links} />
          </div>
        )}

        <a href={`/${artist.slug}/${linkSlug}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-white/30 text-xs hover:text-white/50 transition-colors">
          <Music2 className="w-3 h-3" /> Powered by FlyLink
        </a>
      </div>
    </div>
  )
}
