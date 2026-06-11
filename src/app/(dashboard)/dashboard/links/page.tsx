import Link from 'next/link'
import { Plus, Search, ExternalLink, Eye, MousePointerClick } from 'lucide-react'
import { getArtistForCurrentUser, getPromoLinksForArtist } from '@/lib/supabase/queries'

export default async function LinksPage() {
  const artist = await getArtistForCurrentUser()
  const links = artist ? await getPromoLinksForArtist(artist.id) : []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My FlyLinks</h1>
        <Link href="/dashboard/links/create" className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />
          Create Link
        </Link>
      </div>

      {links.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input placeholder="Search links..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
            <Plus className="w-7 h-7 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Your Music Deserves a Spotlight</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm">Create smart links that bring all your streaming platforms together.</p>
          <Link href="/dashboard/links/create" className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
            <Plus className="w-4 h-4" />
            Create Your First FlyLink
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(links as {
            id: string; title: string; slug: string; artist_name: string;
            release_type: string; is_published: boolean; view_count: number; click_count: number;
            cover_url?: string; streaming_links: { platform: string }[]
          }[]).map((link) => (
            <div key={link.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-zinc-700 shrink-0 overflow-hidden">
                {link.cover_url && <img src={link.cover_url} alt={link.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-white truncate">{link.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${link.is_published ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {link.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{link.artist_name} · {link.release_type} · {link.streaming_links?.length ?? 0} platforms</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-500 shrink-0">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{link.view_count}</span>
                <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" />{link.click_count}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {link.is_published && artist && (
                  <a href={`/${artist.slug}/${link.slug}`} target="_blank" className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <Link href={`/dashboard/links/${link.id}/edit`} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
