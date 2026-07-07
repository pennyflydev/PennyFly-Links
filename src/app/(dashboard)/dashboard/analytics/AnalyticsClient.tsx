'use client'

import { useMemo, useState } from 'react'
import { Eye, MousePointerClick, TrendingUp, Users, Download, ArrowUpDown } from 'lucide-react'

type Event = {
  event_type: 'view' | 'click'
  platform: string | null
  promo_link_id: string | null
  country: string | null
  created_at: string
}
type LinkMeta = { id: string; title: string; slug: string; is_published: boolean }
type Subscriber = { source: string; source_id: string | null; created_at: string }
type Presave = { id: string; title: string; slug: string; save_count: number }

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: 'all', label: 'All time', days: 0 },
] as const

const PLATFORM_LABELS: Record<string, string> = {
  spotify: 'Spotify', apple_music: 'Apple Music', youtube_music: 'YouTube Music',
  tidal: 'Tidal', amazon_music: 'Amazon Music', deezer: 'Deezer',
  bandcamp: 'Bandcamp', soundcloud: 'SoundCloud',
}

function flag(cc: string | null) {
  if (!cc || cc.length !== 2) return '🌐'
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

type SortKey = 'title' | 'views' | 'clicks' | 'ctr' | 'fans'

export default function AnalyticsClient({
  events,
  links,
  subscribers,
  presaves,
}: {
  events: Event[]
  links: LinkMeta[]
  subscribers: Subscriber[]
  presaves: Presave[]
}) {
  const [range, setRange] = useState<string>('30d')
  const [sortKey, setSortKey] = useState<SortKey>('clicks')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const days = RANGES.find((r) => r.id === range)?.days ?? 30
  const cutoff = days === 0 ? 0 : Date.now() - days * 86400000

  const evts = useMemo(() => events.filter((e) => new Date(e.created_at).getTime() >= cutoff), [events, cutoff])
  const subs = useMemo(() => subscribers.filter((s) => new Date(s.created_at).getTime() >= cutoff), [subscribers, cutoff])

  const totalViews = evts.filter((e) => e.event_type === 'view').length
  const totalClicks = evts.filter((e) => e.event_type === 'click').length
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0'

  // Per-link rollup
  const linkRows = useMemo(() => {
    const rows = links.map((l) => {
      const le = evts.filter((e) => e.promo_link_id === l.id)
      const views = le.filter((e) => e.event_type === 'view').length
      const clicks = le.filter((e) => e.event_type === 'click').length
      const platformCounts: Record<string, number> = {}
      for (const e of le) if (e.event_type === 'click' && e.platform) platformCounts[e.platform] = (platformCounts[e.platform] ?? 0) + 1
      const top = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      const fans = subs.filter((s) => s.source_id === l.id).length
      return {
        id: l.id, title: l.title, slug: l.slug, is_published: l.is_published,
        views, clicks, ctr: views > 0 ? (clicks / views) * 100 : 0, fans, top,
      }
    })
    const dir = sortDir === 'desc' ? -1 : 1
    return rows.sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title) * dir
      return (a[sortKey] - b[sortKey]) * dir
    })
  }, [links, evts, subs, sortKey, sortDir])

  // Platform breakdown
  const platformRows = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of evts) if (e.event_type === 'click' && e.platform) counts[e.platform] = (counts[e.platform] ?? 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [evts])
  const platformMax = Math.max(1, ...platformRows.map((r) => r[1]))

  // Geography
  const geoRows = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of evts) { const c = e.country ?? 'Unknown'; counts[c] = (counts[c] ?? 0) + 1 }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [evts])
  const geoMax = Math.max(1, ...geoRows.map((r) => r[1]))

  // Daily trend
  const buckets = useMemo(() => {
    const span = days || 30
    const out: { label: string; views: number; clicks: number }[] = []
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
      const start = d.getTime(), end = start + 86400000
      const de = evts.filter((e) => { const t = new Date(e.created_at).getTime(); return t >= start && t < end })
      out.push({ label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }), views: de.filter((e) => e.event_type === 'view').length, clicks: de.filter((e) => e.event_type === 'click').length })
    }
    return out
  }, [evts, days])
  const trendMax = Math.max(1, ...buckets.map((b) => Math.max(b.views, b.clicks)))

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  function exportCsv() {
    const header = ['Link', 'Slug', 'Status', 'Views', 'Clicks', 'CTR %', 'Fans', 'Top platform']
    const rows = linkRows.map((r) => [r.title, r.slug, r.is_published ? 'Live' : 'Draft', r.views, r.clicks, r.ctr.toFixed(1), r.fans, r.top ? PLATFORM_LABELS[r.top] ?? r.top : '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const kpis = [
    { label: 'Total Views', value: totalViews, icon: Eye },
    { label: 'Total Clicks', value: totalClicks, icon: MousePointerClick },
    { label: 'Overall CTR', value: `${ctr}%`, icon: TrendingUp },
    { label: 'Fans Captured', value: subs.length, icon: Users },
  ]

  const SortHead = ({ k, children, right }: { k: SortKey; children: React.ReactNode; right?: boolean }) => (
    <th className={`px-4 py-3 font-medium ${right ? 'text-right' : 'text-left'}`}>
      <button onClick={() => toggleSort(k)} className={`inline-flex items-center gap-1 hover:text-white transition-colors ${sortKey === k ? 'text-white' : ''}`}>
        {children}<ArrowUpDown className="w-3 h-3 opacity-50" />
      </button>
    </th>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">Every click, every link, every platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            {RANGES.map((r) => (
              <button key={r.id} onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${r.id === range ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} disabled={linkRows.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-40 transition-colors">
            <Download className="w-4 h-4" />CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{label}</span>
              <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Per-link performance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Per-link performance</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Clicks and conversions for each FlyLink. Click a column to sort.</p>
        </div>
        {linkRows.length === 0 ? (
          <div className="px-5 py-12 text-center text-zinc-600 text-sm">No links yet — create a FlyLink to start tracking.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800 text-left">
                  <SortHead k="title">Link</SortHead>
                  <SortHead k="views" right>Views</SortHead>
                  <SortHead k="clicks" right>Clicks</SortHead>
                  <SortHead k="ctr" right>CTR</SortHead>
                  <SortHead k="fans" right>Fans</SortHead>
                  <th className="px-4 py-3 font-medium text-left">Top platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {linkRows.map((r) => (
                  <tr key={r.id} className="text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate max-w-[200px]">{r.title}</span>
                        {!r.is_published && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400">Draft</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.views}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-white font-medium">{r.clicks}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.ctr.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.fans}</td>
                    <td className="px-4 py-3 text-zinc-400">{r.top ? PLATFORM_LABELS[r.top] ?? r.top : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trend */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Views &amp; clicks over time</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-600" />Views</span>
            <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />Clicks</span>
          </div>
        </div>
        {totalViews === 0 && totalClicks === 0 ? (
          <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">No activity in this range yet.</div>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {buckets.map((b, i) => (
              <div key={i} className="flex-1 flex items-end justify-center gap-px h-full" title={`${b.label}: ${b.views} views, ${b.clicks} clicks`}>
                <div className="w-1/2 bg-zinc-600 rounded-t" style={{ height: `${(b.views / trendMax) * 100}%` }} />
                <div className="w-1/2 bg-yellow-400 rounded-t" style={{ height: `${(b.clicks / trendMax) * 100}%` }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform + Geo */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Clicks by platform</h2>
          {platformRows.length === 0 ? (
            <p className="text-zinc-600 text-sm">No clicks yet.</p>
          ) : (
            <div className="space-y-3">
              {platformRows.map(([platform, count]) => (
                <div key={platform}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-zinc-300">{PLATFORM_LABELS[platform] ?? platform}</span>
                    <span className="text-white font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(count / platformMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Top countries</h2>
          {geoRows.length === 0 ? (
            <p className="text-zinc-600 text-sm">No geographic data yet.</p>
          ) : (
            <div className="space-y-3">
              {geoRows.map(([country, count]) => (
                <div key={country}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-zinc-300">{flag(country === 'Unknown' ? null : country)} {country}</span>
                    <span className="text-white font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${(count / geoMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pre-save conversion */}
      {presaves.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Pre-save campaigns</h2>
          <div className="space-y-2.5">
            {presaves.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">{p.title}</span>
                <span className="text-white font-medium tabular-nums">{p.save_count} pre-saves</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
