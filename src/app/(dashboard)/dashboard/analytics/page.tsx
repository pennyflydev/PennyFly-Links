import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const artist = await getArtistForCurrentUser()

  if (!artist) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-5">
          <p className="text-yellow-400 text-sm font-medium">Your account is still being set up.</p>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()
  const [events, links, subscribers, presaves] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('event_type, platform, promo_link_id, country, created_at')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false })
      .limit(10000),
    supabase.from('promo_links').select('id, title, slug, is_published').eq('artist_id', artist.id),
    supabase.from('subscribers').select('source, source_id, created_at').eq('artist_id', artist.id),
    supabase
      .from('presave_campaigns')
      .select('id, title, slug, save_count')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <AnalyticsClient
      events={events.data ?? []}
      links={links.data ?? []}
      subscribers={subscribers.data ?? []}
      presaves={presaves.data ?? []}
    />
  )
}
