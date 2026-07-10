'use client'

import { useMemo, useState } from 'react'
import { LayoutDashboard, MousePointerClick, Link2, TrendingUp } from 'lucide-react'
import QrButton from '@/components/QrButton'

type Event = { event_type: 'view' | 'click'; platform: string | null; created_at: string }

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: '7d', days: 7 },
  { id: '30d', label: '30d', days: 30 },
  { id: 'all', label: 'All', days: 0 },
] as const

const PLATFORM_LABELS: Record<string, string> = {
  spotify: 'Spotify', apple_music: 'Apple Music', youtube_music: 'YouTube Music',
  tidal: 'Tidal', amazon_music: 'Amazon Music', deezer: 'Deezer',
  bandcamp: 'Bandcamp', soundcloud: 'SoundCloud',
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function OverviewClient({
  events,
  allViews,
  allClicks,
  activeLinks,
  artistSlug,
}: {
  events: Event[]
  allViews: number
  allClicks: number
  activeLinks: number
  artistSlug: string | null
}) {
  const [range, setRange] = useState<string>('30d')

  const { filtered, days } = useMemo(() => {
    const r = RANGES.find((x) => x.id === range) ?? RANGES[2]
    if (r.days === 0) return { filtered: events, days: 0 }
    const cutoff = Date.now() - r.days * 86400000
    return { filtered: events.filter((e) => new Date(e.created_at).getTime() >= cutoff), days: r.days }
  }, [events, range])

  // "All" totals come from the server's all-time counts; the other ranges are
  // fully within the fetched 30-day window, so counting the rows is accurate.
  const totalViews = range === 'all' ? allViews : filtered.filter((e) => e.event_type === 'view').length
  const totalClicks = range === 'all' ? allClicks : filtered.filter((e) => e.event_type === 'click').length
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0'

  // Daily buckets for the chart
  const buckets = useMemo(() => {
    const span = days || 30
    const out: { label: string; views: number; clicks: number }[] = []
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const start = d.getTime()
      const end = start + 86400000
      const dayEvents = filtered.filter((e) => {
        const t = new Date(e.created_at).getTime()
        return t >= start && t < end
      })
      out.push({
        label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        views: dayEvents.filter((e) => e.event_type === 'view').length,
        clicks: dayEvents.filter((e) => e.event_type === 'click').length,
      })
    }
    return out
  }, [filtered, days])

  const maxVal = Math.max(1, ...buckets.map((b) => Math.max(b.views, b.clicks)))

  const recentClicks = filtered.filter((e) => e.event_type === 'click').slice(0, 8)

  const topPlatforms = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of filtered) {
      if (e.event_type === 'click' && e.platform) counts[e.platform] = (counts[e.platform] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [filtered])

  const stats = [
    { label: 'Total Views', value: totalViews, icon: LayoutDashboard },
    { label: 'Total Clicks', value: totalClicks, icon: MousePointerClick },
    { label: 'Active Links', value: activeLinks, icon: Link2 },
    { label: 'Overall CTR', value: `${ctr}%`, icon: TrendingUp },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          {artistSlug && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-zinc-400">
                Your page:{' '}
                <a href={`/${artistSlug}`} target="_blank" className="text-yellow-400 hover:underline">
                  pennyfly.com/{artistSlug}
                </a>
              </p>
              <QrButton url={`/${artistSlug}`} filename={`flylink-${artistSlug}`} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                r.id === range ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-400">Views &amp; Clicks</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-600" />Views</span>
              <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />Clicks</span>
            </div>
          </div>
          {totalViews === 0 && totalClicks === 0 ? (
            <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
              No data yet. Share your FlyLinks to start tracking.
            </div>
          ) : (
            <div className="flex items-end gap-1 h-48">
              {buckets.map((b, i) => (
                <div key={i} className="flex-1 flex items-end justify-center gap-px h-full group relative" title={`${b.label}: ${b.views} views, ${b.clicks} clicks`}>
                  <div className="w-1/2 bg-zinc-600 rounded-t" style={{ height: `${(b.views / maxVal) * 100}%` }} />
                  <div className="w-1/2 bg-yellow-400 rounded-t" style={{ height: `${(b.clicks / maxVal) * 100}%` }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent + top platforms */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-medium text-zinc-400 mb-4">Recent Clicks</h2>
            {recentClicks.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-zinc-600 text-sm">No clicks yet.</div>
            ) : (
              <div className="space-y-2.5">
                {recentClicks.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{c.platform ? PLATFORM_LABELS[c.platform] ?? c.platform : 'Link'}</span>
                    <span className="text-zinc-600 text-xs">{relativeTime(c.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {topPlatforms.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-sm font-medium text-zinc-400 mb-4">Top Platforms</h2>
              <div className="space-y-2.5">
                {topPlatforms.map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{PLATFORM_LABELS[platform] ?? platform}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
