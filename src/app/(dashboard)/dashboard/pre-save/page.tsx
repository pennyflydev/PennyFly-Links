import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'

export default async function PreSavePage() {
  const artist = await getArtistForCurrentUser()

  let campaigns: { id: string; title: string; slug: string; release_date: string; save_count: number; is_active: boolean }[] = []
  if (artist) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('presave_campaigns')
      .select('*')
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

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No pre-save campaigns yet</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm">Create a pre-save campaign to capture fan emails and boost your release day streams.</p>
          <Link href="/dashboard/pre-save/create" className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
            <Plus className="w-4 h-4" />Create Your First Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-white">{c.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Releases {new Date(c.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {c.save_count} pre-saves
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/pre-save/${c.slug}`} target="_blank" className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">
                  View Page
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
