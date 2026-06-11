import Link from 'next/link'
import { Radio, Users, TrendingUp } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import RosterInvite, { type Invite } from './RosterInvite'

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
  const supabase = createAdminClient()

  const [{ data: artists }, fans, clicks, { data: invites }] = await Promise.all([
    supabase
      .from('artists')
      .select('id, artist_name, slug, is_signed, created_at, profiles(email, plan), subscribers(count)')
      .order('created_at', { ascending: false }),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'click'),
    supabase
      .from('artist_invites')
      .select('id, email, token, claimed_at, expires_at, created_at')
      .order('created_at', { ascending: false }),
  ])

  const roster = (artists ?? []) as unknown as RosterArtist[]

  const stats = [
    { label: 'Total Artists', value: roster.length, icon: Users },
    { label: 'Total Fans', value: fans.count ?? 0, icon: Users },
    { label: 'Total Link Clicks', value: clicks.count ?? 0, icon: TrendingUp },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Label Roster</h1>
          </div>
          <p className="text-sm text-zinc-400">Your entire roster. One dashboard.</p>
        </div>
      </div>

      <RosterInvite initialInvites={(invites ?? []) as Invite[]} />

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{label}</span>
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
          <h2 className="text-xl font-semibold text-white mb-2">No artists on your roster yet</h2>
          <p className="text-zinc-400 text-sm max-w-sm">
            As artists sign up, they&apos;ll appear here for you to manage from one place.
          </p>
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
                    <Link href={`/${a.slug}`} target="_blank" className="text-yellow-400 hover:underline">
                      /{a.slug}
                    </Link>
                  </td>
                  <td className="px-5 py-3 capitalize text-zinc-400">{a.profiles?.plan ?? '—'}</td>
                  <td className="px-5 py-3 text-zinc-400">{a.subscribers?.[0]?.count ?? 0}</td>
                  <td className="px-5 py-3 text-zinc-500">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
