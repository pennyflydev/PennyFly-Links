import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import PresaveListClient, { type Campaign } from './PresaveListClient'

export default async function PreSavePage() {
  const artist = await getArtistForCurrentUser()

  let campaigns: Campaign[] = []
  if (artist) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('presave_campaigns')
      .select('id, title, slug, release_date, save_count, is_active')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false })
    campaigns = data ?? []
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Pre-save Campaigns</h1>
          <p className="text-sm text-zinc-400 mt-1">Boost your release day streams with fan pre-saves</p>
        </div>
        <Link href="/dashboard/pre-save/create" className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />Create Campaign
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400">
        <span className="text-zinc-200 font-medium">One link, whole release cycle.</span>{' '}
        Each campaign collects pre-saves before drop day, then automatically flips into a full
        streaming link (Spotify, Apple, YouTube &amp; more) the moment it&apos;s out — and alerts
        fans who opted in for drop notifications.
      </div>

      <PresaveListClient initialCampaigns={campaigns} />
    </div>
  )
}
