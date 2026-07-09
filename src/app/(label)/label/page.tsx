import Link from 'next/link'
import { DollarSign, Ticket, Heart, ShoppingBag, Sparkles, Radio, Users, TrendingUp, Star, UserPlus, MousePointerClick } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForUser } from '@/lib/supabase/queries'

// Label HQ — the dedicated dashboard for label accounts (role = 'label') and
// admins. First feature: roster-wide revenue, aggregated across every artist's
// tips, store sales, paid unlocks and ticket sales. Access is gated by the
// (label) layout, which redirects any non-label / non-admin account away.
export default async function LabelHomePage() {
  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'
  const supabase = createAdminClient()

  const labelCtx = profile && !isAdmin ? await getLabelForUser(profile.id) : null
  const label = labelCtx?.label ?? null
  const labelId = label?.id ?? null

  // Roster artists (label → own roster; admin → everyone).
  let artistsQuery = supabase.from('artists').select('id, artist_name, slug').order('artist_name', { ascending: true })
  if (!isAdmin) artistsQuery = artistsQuery.eq('label_id', labelId)
  const { data: artistsData } = await artistsQuery
  const artists = (artistsData ?? []) as { id: string; artist_name: string; slug: string }[]
  const artistIds = artists.map((a) => a.id)

  // Per-artist revenue, in cents, split by source. Gross = what fans paid.
  type Rev = { tickets: number; tips: number; store: number; unlocks: number }
  const zero = (): Rev => ({ tickets: 0, tips: 0, store: 0, unlocks: 0 })
  const byArtist = new Map<string, Rev>(artistIds.map((id) => [id, zero()]))
  const add = (id: string, key: keyof Rev, cents: number) => {
    const r = byArtist.get(id)
    if (r) r[key] += cents
  }

  if (artistIds.length) {
    const [tips, purchases, unlocks, ticketTypes] = await Promise.all([
      supabase.from('tips').select('artist_id, amount_cents').in('artist_id', artistIds),
      supabase.from('purchases').select('artist_id, amount_cents').in('artist_id', artistIds),
      supabase.from('unlocks').select('artist_id, amount_cents').in('artist_id', artistIds),
      supabase.from('ticket_types').select('artist_id, sold, price_cents').in('artist_id', artistIds).gt('price_cents', 0),
    ])
    for (const t of tips.data ?? []) add(t.artist_id, 'tips', t.amount_cents ?? 0)
    for (const p of purchases.data ?? []) add(p.artist_id, 'store', p.amount_cents ?? 0)
    for (const u of unlocks.data ?? []) add(u.artist_id, 'unlocks', u.amount_cents ?? 0)
    for (const tt of ticketTypes.data ?? []) add(tt.artist_id, 'tickets', (tt.sold ?? 0) * (tt.price_cents ?? 0))
  }

  // Totals by source + grand total, and a sorted per-artist table.
  const totals = { tickets: 0, tips: 0, store: 0, unlocks: 0 }
  const rows = artists
    .map((a) => {
      const r = byArtist.get(a.id) ?? zero()
      const total = r.tickets + r.tips + r.store + r.unlocks
      totals.tickets += r.tickets
      totals.tips += r.tips
      totals.store += r.store
      totals.unlocks += r.unlocks
      return { ...a, ...r, total }
    })
    .sort((x, y) => y.total - x.total)
  const grand = totals.tickets + totals.tips + totals.store + totals.unlocks

  // Audience metrics — all reliable count queries (head:true), scoped to roster.
  const now = new Date()
  const iso = (d: Date) => d.toISOString()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)

  let totalFans = 0
  let newFans30 = 0
  let superFans = 0
  let totalClicks = 0
  const weeks: { label: string; count: number }[] = []

  if (artistIds.length) {
    const [tf, nf, sf, tc] = await Promise.all([
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).in('artist_id', artistIds),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).in('artist_id', artistIds).gte('created_at', iso(daysAgo(30))),
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).in('artist_id', artistIds).eq('is_superfan', true),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).in('artist_id', artistIds).eq('event_type', 'click'),
    ])
    totalFans = tf.count ?? 0
    newFans30 = nf.count ?? 0
    superFans = sf.count ?? 0
    totalClicks = tc.count ?? 0

    // New fans per week for the last 6 weeks (fan-growth trend).
    const bounds = Array.from({ length: 6 }, (_, i) => {
      const start = daysAgo((6 - i) * 7)
      const end = daysAgo((5 - i) * 7)
      return { label: `${start.getMonth() + 1}/${start.getDate()}`, start: iso(start), end: iso(end) }
    })
    const weekCounts = await Promise.all(
      bounds.map((b) =>
        supabase.from('subscribers').select('id', { count: 'exact', head: true }).in('artist_id', artistIds).gte('created_at', b.start).lt('created_at', b.end)
      )
    )
    bounds.forEach((b, i) => weeks.push({ label: b.label, count: weekCounts[i].count ?? 0 }))
  }
  const weekMax = Math.max(1, ...weeks.map((w) => w.count))

  const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const num = (n: number) => n.toLocaleString('en-US')

  const sourceCards = [
    { key: 'tickets', label: 'Tickets', icon: Ticket, value: totals.tickets },
    { key: 'tips', label: 'Tips', icon: Heart, value: totals.tips },
    { key: 'store', label: 'Store', icon: ShoppingBag, value: totals.store },
    { key: 'unlocks', label: 'Unlocks', icon: Sparkles, value: totals.unlocks },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">{label?.name ? `${label.name} — Label HQ` : 'Label HQ'}</h1>
        </div>
        <p className="text-sm text-zinc-400">
          Roster revenue across every artist. Amounts are gross (what fans paid) — artists keep 97.5% after the 2.5% platform fee.
        </p>
      </div>

      {/* Headline total */}
      <div className="bg-gradient-to-br from-yellow-400/15 to-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
          <DollarSign className="w-4 h-4" /> Total roster revenue
        </div>
        <p className="text-4xl font-bold text-white">{money(grand)}</p>
        <p className="text-xs text-zinc-500 mt-1">{artists.length} artist{artists.length === 1 ? '' : 's'} on the roster</p>
      </div>

      {/* By source */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {sourceCards.map(({ key, label: l, icon: Icon, value }) => (
          <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
              <Icon className="w-3.5 h-3.5" /> {l}
            </div>
            <p className="text-xl font-bold text-white">{money(value)}</p>
          </div>
        ))}
      </div>

      {/* Per-artist breakdown */}
      {artists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
            <Radio className="w-7 h-7 text-yellow-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No artists yet</h2>
          <p className="text-zinc-400 text-sm max-w-sm">
            Invite artists from your <Link href="/roster" className="text-yellow-400 hover:underline">roster</Link> — their sales will roll up here.
          </p>
        </div>
      ) : grand === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-white font-medium mb-1">No sales yet</p>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Once your artists set up payments and sell tickets, tips, store items or unlocks, revenue will appear here per artist.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 text-left">
                <th className="px-5 py-3 font-medium">Artist</th>
                <th className="px-5 py-3 font-medium text-right">Tickets</th>
                <th className="px-5 py-3 font-medium text-right">Tips</th>
                <th className="px-5 py-3 font-medium text-right">Store</th>
                <th className="px-5 py-3 font-medium text-right">Unlocks</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {rows.map((r) => (
                <tr key={r.id} className="text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/${r.slug}`} target="_blank" className="text-white font-medium hover:text-yellow-400 transition-colors">
                      {r.artist_name || 'Unnamed'}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{r.tickets ? money(r.tickets) : '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{r.tips ? money(r.tips) : '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{r.store ? money(r.store) : '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{r.unlocks ? money(r.unlocks) : '—'}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-white font-semibold">{money(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-800 text-zinc-300">
                <td className="px-5 py-3 font-semibold text-white">Total</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(totals.tickets)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(totals.tips)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(totals.store)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{money(totals.unlocks)}</td>
                <td className="px-5 py-3 text-right tabular-nums text-yellow-400 font-bold">{money(grand)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Audience & engagement */}
      {artists.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Audience &amp; engagement</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Total fans', value: num(totalFans), icon: Users },
              { label: 'New fans (30d)', value: num(newFans30), icon: UserPlus },
              { label: 'Superfans', value: num(superFans), icon: Star },
              { label: 'Total clicks', value: num(totalClicks), icon: MousePointerClick },
            ].map(({ label: l, value, icon: Icon }) => (
              <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
                  <Icon className="w-3.5 h-3.5" /> {l}
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Fan growth — new fans per week, last 6 weeks */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="text-sm font-medium text-white mb-4">Fan growth <span className="text-zinc-500 font-normal">· new fans per week</span></p>
            <div className="flex items-end justify-between gap-2">
              {weeks.map((w) => (
                <div key={w.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-xs text-zinc-400 tabular-nums">{w.count}</span>
                  <div className="w-full h-24 bg-zinc-800/50 rounded-md flex items-end overflow-hidden">
                    <div className="w-full bg-yellow-400/80" style={{ height: `${Math.round((w.count / weekMax) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-600 tabular-nums">{w.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center gap-4 text-sm">
        <Link href="/roster" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <Users className="w-4 h-4" /> Manage roster
        </Link>
      </div>
    </div>
  )
}
