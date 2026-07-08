import { Music2, Users, Flame, ExternalLink } from 'lucide-react'
import { fetchArtistInsights } from '@/lib/spotify'
import SpotifyConnect from './SpotifyConnect'

// Server component: renders the artist's public Spotify metrics, or a connect
// form if not yet linked.
export default async function SpotifyInsights({ spotifyArtistId }: { spotifyArtistId: string | null }) {
  const insights = spotifyArtistId ? await fetchArtistInsights(spotifyArtistId) : null

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-1">
        <Music2 className="w-5 h-5 text-[#1DB954]" />
        <h2 className="text-lg font-semibold text-white">Spotify Insights</h2>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        Public Spotify metrics. (Stream counts &amp; monthly listeners are Spotify-for-Artists only and aren&apos;t
        available through Spotify&apos;s public API.)
      </p>

      {!spotifyArtistId ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-zinc-300 mb-3">
            Connect your Spotify artist profile to see your followers, popularity, and top tracks here.
          </p>
          <SpotifyConnect />
        </div>
      ) : !insights ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-yellow-400 mb-3">
            Couldn&apos;t load Spotify data. Double-check the artist link, or reconnect below.
          </p>
          <SpotifyConnect />
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            {insights.image ? (
              <img src={insights.image} alt={insights.name} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <Music2 className="w-6 h-6 text-zinc-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{insights.name}</p>
              {insights.genres.length > 0 && (
                <p className="text-xs text-zinc-500 truncate">{insights.genres.join(' · ')}</p>
              )}
            </div>
            {insights.url && (
              <a href={insights.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                <Users className="w-3.5 h-3.5" /> Followers
              </div>
              <p className="text-2xl font-bold text-white">{insights.followers.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                <Flame className="w-3.5 h-3.5" /> Popularity
              </div>
              <p className="text-2xl font-bold text-white">
                {insights.popularity}
                <span className="text-sm text-zinc-500 font-normal">/100</span>
              </p>
            </div>
          </div>

          {/* Top tracks */}
          {insights.topTracks.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Top tracks</p>
              <div className="space-y-1">
                {insights.topTracks.map((t, i) => (
                  <a
                    key={i}
                    href={t.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="text-xs text-zinc-600 w-4 text-right">{i + 1}</span>
                    {t.coverUrl ? (
                      <img src={t.coverUrl} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-zinc-800" />
                    )}
                    <span className="flex-1 min-w-0 text-sm text-white truncate">{t.name}</span>
                    <span className="text-xs text-zinc-500">{t.popularity}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1">
            <SpotifyConnect compact />
            <p className="text-[11px] text-zinc-600 mt-1">Paste a different link above to reconnect.</p>
          </div>
        </div>
      )}
    </section>
  )
}
