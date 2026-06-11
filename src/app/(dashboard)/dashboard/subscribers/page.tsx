import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import SubscribersClient, { type Subscriber } from './SubscribersClient'

export default async function SubscribersPage() {
  const artist = await getArtistForCurrentUser()

  let subscribers: Subscriber[] = []
  if (artist) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('subscribers')
      .select('id, email, name, source, country, created_at')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false })
    subscribers = data ?? []
  }

  const now = Date.now()
  const weekAgo = now - 7 * 86400000
  const monthAgo = now - 30 * 86400000

  const stats = [
    { label: 'Total Subscribers', value: subscribers.length },
    { label: 'New This Week', value: subscribers.filter((s) => new Date(s.created_at).getTime() >= weekAgo).length },
    { label: 'New This Month', value: subscribers.filter((s) => new Date(s.created_at).getTime() >= monthAgo).length },
    { label: 'Sources', value: new Set(subscribers.map((s) => s.source)).size },
  ]

  return <SubscribersClient subscribers={subscribers} stats={stats} />
}
