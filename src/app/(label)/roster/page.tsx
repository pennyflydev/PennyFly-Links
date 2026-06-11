import Link from 'next/link'
import { Radio, Users, TrendingUp } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForProfile } from '@/lib/supabase/queries'
import RosterInvite, { type Invite } from './RosterInvite'
import ActAsButton from './ActAsButton'

type RosterArtist = {
  id: string
  artist_name: string
  slug: string
  is_signed: boolean
  created_at: string
  profiles: { email: string; plan: string } | null
  subscribers: { count: number }[]
}

export default async function RosterPage() {
  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'
  const supabase = createAdminClient()

  // Label accounts are scoped to their own roster; admins see everything.
  const label = profile && !isAdmin ? await getLabelForProfile(profile.id) : null
  const labelId = label?.id ?? null

  let artistsQuery = supabase
    .from('artists')
    .select('id, artist_name, slug, is_signed, created_at, profiles(email, plan), subscribers(count)')
    .order('created_at', { ascending: false })
  if (!isAdmin) artistsQuery = artistsQuery.eq('label_id', labelId)

  const { data: artistsData } = await artistsQuery
  const roster = (artistsData ?? []) as unknown as RosterArtist[]
  const artistIds = roster.map((a) => a.id)

  // Aggregate stats (scoped for labels)
  let fansCount = 0
  let clicksCount = 0
  if (isAdmin) {
    const [fans, clicks] = await Promise.all([
      supabase.from('subscribers').select('id', { count: 'exact', head: true }),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'click'),
    ])
    fansCount = fans.count ?? 0
    clicksCount = clicks.count ?? 0
  } else if (artistIds.length) {
    const [fans, clicks] = await Promise.all([
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).in('artist_id', artistIds),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'click').in('artist_id', artistIds),
    ])
    fansCount = fans.count ?? 0
    clicksCount = clicks.count ?? 0
  }

  // Invites (scoped for labels)
  let invitesQuery = supabase
    .from('artist_invites')
    .select('id, email, token, claimed_at, expires_at, created_at')
    .order('created_at', { ascending: false })
  if (!isAdmin) invitesQuery = invitesQuery.eq('label_id', labelId)
  const { data: invites } = await invitesQuery

  const stats = [
    { label: 'Artists', value: roster.length, icon: Users },
    { label: 'Total Fans', value: fansCount, icon: Users },
    { label: 'Total Link Clicks', value: clicksCount, icon: TrendingUp },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">{isAdmin ? 'All Artists' : 'My Roster'}</h1>
          </div>
          <p className="text-sm text-zinc-400">
            {isAdmin ? 'Every artist on the platform. Act as anyone to help them.' : 'Your roster. One dashboard.'}
          </p>
        </div>
      </div>

      <RosterInvite initialInvites={(invites ?? []) as Invite[]} />

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label: l, value, icon: Icon }) => (
          <div key={l} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{l}</span>
              <Icon className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {roster.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
            <Radio className="w-7 h-7 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No artists yet</h2>
          <p className="text-zinc-400 text-sm max-w-sm">Invite an artist by email above — they&apos;ll appear here once they sign up.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 text-left">
                <th className="px-5 py-3 font-medium">Artist</th>
                <th className="px-5 py-3 font-medium">Page</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Fans</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {roster.map((a) => (
                <tr key={a.id} className="text-zinc-300 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{a.artist_name || 'Unnamed'}</span>
                      {a.is_signed && (
                        <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full text-xs font-medium">Signed</span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500">{a.profiles?.email}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/${a.slug}`} target="_blank" className="text-yellow-400 hover:underline">/{a.slug}</Link>
                  </td>
                  <td className="px-5 py-3 capitalize text-zinc-400">{a.profiles?.plan ?? '—'}</td>
                  <td className="px-5 py-3 text-zinc-400">{a.subscribers?.[0]?.count ?? 0}</td>
                  <td className="px-5 py-3 text-zinc-500">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/roster/${a.id}`} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">
                        View
                      </Link>
                      <ActAsButton artistId={a.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
