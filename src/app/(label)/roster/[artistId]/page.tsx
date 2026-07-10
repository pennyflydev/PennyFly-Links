import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ExternalLink, Eye, MousePointerClick, Users, Link2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, canManageArtist } from '@/lib/supabase/queries'
import ActAsButton from '../ActAsButton'

export default async function ArtistDetailPage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = await params
  const profile = await getCurrentProfile()
  if (!profile) redirect('/sign-in')

  const supabase = createAdminClient()
  const { data: artist } = await supabase
    .from('artists')
    .select('*, profiles(email, plan, role)')
    .eq('id', artistId)
    .single()

  if (!artist) notFound()
  if (!(await canManageArtist(profile, artist))) redirect('/roster')

  const [links, campaigns, views, clicks, fans] = await Promise.all([
    supabase.from('promo_links').select('id, title, slug, is_published, view_count, click_count').eq('artist_id', artistId).order('created_at', { ascending: false }),
    supabase.from('presave_campaigns').select('id, title, slug, is_active, save_count, release_date').eq('artist_id', artistId).order('created_at', { ascending: false }),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('artist_id', artistId).eq('event_type', 'view'),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('artist_id', artistId).eq('event_type', 'click'),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('artist_id', artistId),
  ])

  const promoLinks = links.data ?? []
  const presaves = campaigns.data ?? []

  const stats = [
    { label: 'Views', value: views.count ?? 0, icon: Eye },
    { label: 'Clicks', value: clicks.count ?? 0, icon: MousePointerClick },
    { label: 'Fans', value: fans.count ?? 0, icon: Users },
    { label: 'Live Links', value: promoLinks.filter((l) => l.is_published).length, icon: Link2 },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/roster" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to roster
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {artist.avatar_url ? (
            <img src={artist.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border border-zinc-700" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{artist.artist_name || 'Unnamed'}</h1>
              {artist.is_signed && <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full text-xs font-medium">Signed</span>}
            </div>
            <p className="text-sm text-zinc-500">{artist.profiles?.email} · {artist.profiles?.plan ?? '—'} plan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/${artist.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />Public page
          </a>
          <ActAsButton artistId={artist.id} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{label}</span>
              <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">FlyLinks ({promoLinks.length})</h2>
          {promoLinks.length === 0 ? (
            <p className="text-zinc-600 text-sm">No links yet.</p>
          ) : (
            <div className="space-y-2">
              {promoLinks.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-300">{l.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${l.is_published ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                      {l.is_published ? 'Live' : 'Draft'}
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500">{l.view_count} views · {l.click_count} clicks</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Pre-saves ({presaves.length})</h2>
          {presaves.length === 0 ? (
            <p className="text-zinc-600 text-sm">No campaigns yet.</p>
          ) : (
            <div className="space-y-2">
              {presaves.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-300">{c.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500">{c.save_count} saves</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
