import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import MembershipClient, { type Tier } from './MembershipClient'

export default async function MembershipPage() {
  const artist = await getArtistForCurrentUser()

  let tiers: Tier[] = []
  if (artist) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('membership_tiers')
      .select('*')
      .eq('artist_id', artist.id)
      .order('sort_order', { ascending: true })
      .order('price_cents', { ascending: true })
    tiers = data ?? []
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Membership</h1>
        <p className="text-sm text-zinc-400 mt-1">Recurring support tiers with perks for your biggest fans</p>
      </div>
      <MembershipClient initialTiers={tiers} />
    </div>
  )
}
