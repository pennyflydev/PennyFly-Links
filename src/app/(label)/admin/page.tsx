import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Users, Radio, UserPlus, MousePointerClick, Eye, Link2, Calendar, Mail } from 'lucide-react'
import { getCurrentProfile } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'

type ProfileRow = { id: string; email: string; role: string; plan: string; created_at: string }
type TopArtist = { id: string; artist_name: string; slug: string; subscribers: { count: number }[] }

const PLAN_LABELS: Record<string, string> = {
  signed: 'Signed (free)', starter: 'Starter', pro: 'Pro', label: 'Label', enterprise: 'Enterprise',
}

export default async function AdminOverview() {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') redirect('/roster')

  const supabase = createAdminClient()
  const [profilesRes, fans, views, clicks, links, presaves, events, topRes] = await Promise.all([
    supabase.from('profiles').select('id, email, role, plan, created_at').order('created_at', { ascending: false }).limit(5000),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'view'),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'click'),
    supabase.from('promo_links').select('id', { count: 'exact', head: true }),
    supabase.from('presave_campaigns').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('artists').select('id, artist_name, slug, subscribers(count)').limit(500),
  ])

  const profiles = (profilesRes.data ?? []) as ProfileRow[]
  const now = Date.now()
  const weekAgo = now - 7 * 86400000
  const monthAgo = now - 30 * 86400000

  const artists = profiles.filter((p) => p.role === 'artist')
  const labels = profiles.filter((p) => p.role === 'label')
  const newThisWeek = profiles.filter((p) => new Date(p.created_at).getTime() >= weekAgo).length
  const newThisMonth = profiles.filter((p) => new Date(p.created_at).getTime() >= monthAgo).length

  // Plan mix
  const planCounts: Record<string, number> = {}
  for (const p of profiles) planCounts[p.plan] = (planCounts[p.plan] ?? 0) + 1
  const planRows = Object.entries(planCounts).sort((a, b) => b[1] - a[1])
  const planMax = Math.max(1, ...planRows.map((r) => r[1]))

  // 30-day signup chart
  const buckets: { label: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
    const start = d.getTime(), end = start + 86400000
    buckets.push({
      label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      count: profiles.filter((p) => { const t = new Date(p.created_at).getTime(); return t >= start && t < end }).length,
    })
  }
  const bucketMax = Math.max(1, ...buckets.map((b) => b.count))

  const topArtists = ((topRes.data ?? []) as TopArtist[])
    .map((a) => ({ ...a, fans: a.subscribers?.[0]?.count ?? 0 }))
    .sort((a, b) => b.fans - a.fans)
    .slice(0, 8)

  const kpis = [
    { label: 'Total Accounts', value: profiles.length, icon: Users },
    { label: 'Artists', value: artists.length, icon: UserPlus },
    { label: 'Labels', value: labels.length, icon: Radio },
    { label: 'Fans Captured', value: fans.count ?? 0, icon: Mail },
    { label: 'Page Views', value: views.count ?? 0, icon: Eye },
    { label: 'Link Clicks', value: clicks.count ?? 0, icon: MousePointerClick },
    { label: 'FlyLinks', value: links.count ?? 0, icon: Link2 },
    { label: 'Pre-saves + Events', value: (presaves.count ?? 0) + (events.count ?? 0), icon: Calendar },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {newThisWeek} new this week · {newThisMonth} this month
          </p>
        </div>
        <Link href="/roster" className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">
          All Artists →
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{label}</span>
              <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Signups over time */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-white mb-4">New accounts · last 30 days</h2>
        {profiles.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">No signups yet.</div>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {buckets.map((b, i) => (
              <div key={i} className="flex-1 flex items-end justify-center h-full" title={`${b.label}: ${b.count}`}>
                <div className="w-full bg-yellow-400 rounded-t" style={{ height: `${(b.count / bucketMax) * 100}%`, minHeight: b.count > 0 ? '3px' : '0' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan mix + recent signups */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Plan mix</h2>
          <div className="space-y-3">
            {planRows.map(([plan, count]) => (
              <div key={plan}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-300">{PLAN_LABELS[plan] ?? plan}</span>
                  <span className="text-white font-medium tabular-nums">{count}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(count / planMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Recent signups</h2>
          {profiles.length === 0 ? (
            <p className="text-zinc-600 text-sm">None yet.</p>
          ) : (
            <div className="space-y-2.5">
              {profiles.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300 truncate max-w-[200px]">{p.email}</span>
                  <span className="text-xs text-zinc-500 flex items-center gap-2">
                    <span className="capitalize">{p.role}</span>
                    <span className="text-zinc-600">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top artists */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Top artists by fans</h2>
        {topArtists.length === 0 ? (
          <p className="text-zinc-600 text-sm">No artists yet.</p>
        ) : (
          <div className="space-y-2.5">
            {topArtists.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-3">
                  <span className="text-zinc-600 tabular-nums w-4">{i + 1}</span>
                  <Link href={`/roster/${a.id}`} className="text-zinc-300 hover:text-white transition-colors">{a.artist_name || a.slug}</Link>
                </span>
                <span className="text-white font-medium tabular-nums">{a.fans} fans</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
