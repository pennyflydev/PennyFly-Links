import Link from 'next/link'
import { Music2, CalendarDays, Heart } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'

type ArtistLite = { id: string; artist_name: string; slug: string; avatar_url: string | null }

export default async function FanFeedPage() {
  const profile = await getCurrentProfile()
  const supabase = createAdminClient()

  // Artists this fan follows.
  const { data: follows } = await supabase
    .from('fan_follows')
    .select('artist_id, artists(id, artist_name, slug, avatar_url)')
    .eq('fan_profile_id', profile?.id ?? '')
    .order('created_at', { ascending: false })

  const artists: ArtistLite[] = (follows ?? [])
    .map((f) => f.artists as unknown as ArtistLite)
    .filter(Boolean)
  const artistIds = artists.map((a) => a.id)
  const artistById = new Map(artists.map((a) => [a.id, a]))

  const today = new Date().toISOString().slice(0, 10)

  // Latest releases + pre-saves from followed artists.
  const releases = artistIds.length
    ? (
        await supabase
          .from('presave_campaigns')
          .select('id, title, slug, cover_url, release_date, artist_id')
          .in('artist_id', artistIds)
          .eq('is_active', true)
          .order('release_date', { ascending: false })
          .limit(30)
      ).data ?? []
    : []

  // Upcoming shows.
  const events = artistIds.length
    ? (
        await supabase
          .from('events')
          .select('id, title, slug, start_at, city, venue, artist_id')
          .in('artist_id', artistIds)
          .eq('is_published', true)
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true })
          .limit(30)
      ).data ?? []
    : []

  const hasFollows = artists.length > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Your Feed</h1>
        <p className="text-sm text-zinc-400 mt-1">Drops and shows from the artists you follow</p>
      </div>

      {!hasFollows ? (
        <div className="flex flex-col items-center text-center py-16 gap-3">
          <Heart className="w-10 h-10 text-zinc-700" />
          <p className="text-zinc-300 font-medium">You&apos;re not following anyone yet</p>
          <p className="text-zinc-500 text-sm max-w-xs">
            Tap <span className="text-white font-medium">Follow</span> on any artist&apos;s FlyLink page to see
            their new releases and shows here.
          </p>
        </div>
      ) : (
        <>
          {/* Following row */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Following · {artists.length}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {artists.map((a) => (
                <Link key={a.id} href={`/${a.slug}`} className="flex flex-col items-center gap-2 shrink-0 w-16">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt={a.artist_name} className="w-14 h-14 rounded-full object-cover border border-zinc-800" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-zinc-500" />
                    </div>
                  )}
                  <span className="text-[11px] text-zinc-400 truncate w-full text-center">{a.artist_name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Releases */}
          {releases.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Releases &amp; pre-saves</h2>
              <div className="space-y-2">
                {(releases as { id: string; title: string; slug: string; cover_url: string | null; release_date: string; artist_id: string }[]).map((r) => {
                  const a = artistById.get(r.artist_id)
                  const out = new Date(r.release_date).getTime() <= Date.now()
                  return (
                    <Link key={r.id} href={`/pre-save/${r.slug}`} className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-900 transition-colors">
                      {r.cover_url ? (
                        <img src={r.cover_url} alt={r.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0"><Music2 className="w-5 h-5 text-zinc-500" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{r.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{a?.artist_name}</p>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${out ? 'text-green-400' : 'text-yellow-400'}`}>
                        {out ? 'Out now' : 'Pre-save'}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Shows */}
          {events.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Upcoming shows</h2>
              <div className="space-y-2">
                {(events as { id: string; title: string; slug: string; start_at: string; city: string | null; venue: string | null; artist_id: string }[]).map((e) => {
                  const a = artistById.get(e.artist_id)
                  return (
                    <Link key={e.id} href={`/events/${e.slug}`} className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 hover:bg-zinc-900 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0"><CalendarDays className="w-5 h-5 text-zinc-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{e.title}</p>
                        <p className="text-xs text-zinc-500 truncate">
                          {a?.artist_name}
                          {(e.city || e.venue) && ` · ${[e.venue, e.city].filter(Boolean).join(', ')}`}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-400 shrink-0">
                        {new Date(e.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
