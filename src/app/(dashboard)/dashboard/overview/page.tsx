import { LayoutDashboard, MousePointerClick, Link2, TrendingUp } from 'lucide-react'
import { getArtistForCurrentUser, getAnalyticsSummary } from '@/lib/supabase/queries'

export default async function OverviewPage() {
  const artist = await getArtistForCurrentUser()
  const summary = artist ? await getAnalyticsSummary(artist.id) : null

  const stats = [
    { label: 'Total Views', value: summary ? String(summary.totalViews) : '—', icon: LayoutDashboard },
    { label: 'Total Clicks', value: summary ? String(summary.totalClicks) : '—', icon: MousePointerClick },
    { label: 'Active Links', value: summary ? String(summary.activeLinks) : '—', icon: Link2 },
    { label: 'Overall CTR', value: summary ? `${summary.ctr}%` : '—', icon: TrendingUp },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          {artist && (
            <p className="text-sm text-zinc-400 mt-1">
              Your page: <a href={`/${artist.slug}`} target="_blank" className="text-yellow-400 hover:underline">pennyfly.com/{artist.slug}</a>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {['Today', '7d', '30d', 'All'].map((range) => (
            <button key={range} className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${range === '30d' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{label}</span>
              <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {!artist && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-5 mb-6">
          <p className="text-yellow-400 text-sm font-medium">Your account is still being set up.</p>
          <p className="text-zinc-400 text-xs mt-1">If this persists after a page refresh, contact support.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Views & Clicks</h2>
          <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
            No data yet. Share your FlyLinks to start tracking.
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Recent Clicks</h2>
          <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
            No clicks yet.
          </div>
        </div>
      </div>
    </div>
  )
}
