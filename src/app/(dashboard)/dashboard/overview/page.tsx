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
  const [{ data: events }, links] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('event_type, platform, created_at')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase
      .from('promo_links')
      .select('id', { count: 'exact', head: true })
      .eq('artist_id', artist.id)
      .eq('is_published', true),
  ])

  return <OverviewClient events={events ?? []} activeLinks={links.count ?? 0} artistSlug={artist.slug} />
}
