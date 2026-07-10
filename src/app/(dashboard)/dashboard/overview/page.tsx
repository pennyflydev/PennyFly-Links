import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import OverviewClient from './OverviewClient'

export default async function OverviewPage() {
  const artist = await getArtistForCurrentUser()

  if (!artist) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Overview</h1>
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-5">
          <p className="text-yellow-400 text-sm font-medium">Your account is still being set up.</p>
          <p className="text-zinc-400 text-xs mt-1">If this persists after a page refresh, contact support.</p>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()
  // Only the last 30 days are fetched — that's all the chart, recent-clicks and
  // top-platforms panels ever show. All-time totals come from cheap count
  // queries instead of downloading every analytics row, so the stat cards stay
  // correct no matter how much traffic an artist has.
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const [{ data: events }, { count: allViews }, { count: allClicks }, links] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('event_type, platform, created_at')
      .eq('artist_id', artist.id)
      .gte('created_at', since30)
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('artist_id', artist.id).eq('event_type', 'view'),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('artist_id', artist.id).eq('event_type', 'click'),
    supabase.from('promo_links').select('id', { count: 'exact', head: true }).eq('artist_id', artist.id).eq('is_published', true),
  ])

  return (
    <OverviewClient
      events={events ?? []}
      allViews={allViews ?? 0}
      allClicks={allClicks ?? 0}
      activeLinks={links.count ?? 0}
      artistSlug={artist.slug}
    />
  )
}
