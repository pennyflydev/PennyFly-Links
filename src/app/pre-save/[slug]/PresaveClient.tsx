'use client'

import { useEffect, useState } from 'react'
import { Music2, Check } from 'lucide-react'

type Props = {
  campaignId: string
  slug: string
  title: string
  artistName: string
  artistSlug: string | null
  coverUrl: string | null
  releaseDate: string
  description: string
  spotifyUrl: string | null
  showFanCount: boolean
  saveCount: number
  isActive: boolean
  connected: boolean
  smartLinks: { platform: string; url: string }[]
}

const PLATFORM_LABELS: Record<string, string> = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube_music: 'YouTube Music',
  tidal: 'Tidal',
  amazon_music: 'Amazon Music',
  deezer: 'Deezer',
  bandcamp: 'Bandcamp',
  soundcloud: 'SoundCloud',
}

const PLATFORM_COLORS: Record<string, string> = {
  spotify: 'bg-[#1DB954] hover:bg-[#1ed760]',
  apple_music: 'bg-[#fc3c44] hover:bg-[#ff4d55]',
  youtube_music: 'bg-[#FF0000] hover:bg-[#ff1a1a]',
  tidal: 'bg-zinc-700 hover:bg-zinc-600',
  amazon_music: 'bg-[#00A8E1] hover:bg-[#00b8f5]',
  deezer: 'bg-[#A238FF] hover:bg-[#b04dff]',
  bandcamp: 'bg-[#1da0c3] hover:bg-[#22b3d9]',
  soundcloud: 'bg-[#ff5500] hover:bg-[#ff6600]',
}

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds }
}

export default function PresaveClient(props: Props) {
  const releaseAt = new Date(props.releaseDate)
  const [countdown, setCountdown] = useState(() => getCountdown(releaseAt))

  const isReleased = countdown === null

  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown(releaseAt)), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.releaseDate])

  const formattedDate = releaseAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        {/* Cover */}
        {props.coverUrl ? (
          <img
            src={props.coverUrl}
            alt={props.title}
            className="w-56 h-56 rounded-2xl object-cover shadow-2xl"
          />
        ) : (
          <div className="w-56 h-56 rounded-2xl bg-zinc-800 flex items-center justify-center shadow-2xl">
            <Music2 className="w-16 h-16 text-zinc-600" />
          </div>
        )}

        {/* Title */}
        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-[0.2em] mb-2">
            {isReleased ? 'Out Now' : 'Pre-Save'}
          </p>
          <h1 className="text-3xl font-bold">{props.title}</h1>
          {props.artistName && <p className="text-zinc-400 mt-1">{props.artistName}</p>}
          {props.description && (
            <p className="text-sm text-zinc-500 mt-3 leading-relaxed">{props.description}</p>
          )}
        </div>

        {/* Countdown */}
        {!isReleased && countdown && (
          <div className="flex items-center gap-3">
            {[
              { v: countdown.days, l: 'Days' },
              { v: countdown.hours, l: 'Hrs' },
              { v: countdown.minutes, l: 'Min' },
              { v: countdown.seconds, l: 'Sec' },
            ].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center bg-zinc-900 border border-zinc-800 rounded-xl w-16 py-2">
                <span className="text-2xl font-bold tabular-nums">{String(v).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">{l}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-zinc-500 -mt-2">
          {isReleased ? `Released ${formattedDate}` : `Releases ${formattedDate}`}
        </p>

        {/* Connect / success */}
        {props.connected ? (
          <div className="w-full bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <p className="font-semibold text-white">You&apos;re all set!</p>
            <p className="text-sm text-zinc-400">
              {isReleased
                ? "Added to your Spotify library — enjoy!"
                : "We'll add it to your Spotify library the moment it drops."}
            </p>
            {props.spotifyUrl && (
              <a
                href={props.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 px-5 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-full text-sm font-semibold transition-colors"
              >
                Open in Spotify
              </a>
            )}
          </div>
        ) : isReleased && props.smartLinks.length > 0 ? (
          // Released: the pre-save link has flipped into a full streaming link.
          <div className="w-full flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {props.smartLinks.map((sl) => {
                // Spotify still routes through our connector so we capture the
                // fan's verified email and save the release to their library.
                const isSpotify = sl.platform === 'spotify'
                const href = isSpotify
                  ? `/api/auth/spotify/start?type=presave&id=${props.campaignId}`
                  : sl.url
                return (
                  <a
                    key={sl.platform}
                    href={href}
                    target={isSpotify ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-white text-sm font-semibold transition-colors ${
                      PLATFORM_COLORS[sl.platform] ?? 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  >
                    {PLATFORM_LABELS[sl.platform] ?? sl.platform}
                  </a>
                )
              })}
            </div>
            <p className="text-xs text-zinc-600">Out now — listen on your platform of choice.</p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <a
              href={`/api/auth/spotify/start?type=presave&id=${props.campaignId}`}
              className="w-full py-3.5 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Music2 className="w-4 h-4" />
              {isReleased ? 'Save on Spotify' : 'Pre-Save on Spotify'}
            </a>
            <p className="text-xs text-zinc-600">
              You&apos;ll sign in with Spotify — {isReleased ? 'the song is added to your library instantly.' : 'we add the release to your library on drop day.'}
            </p>
          </div>
        )}

        {/* Fan counter */}
        {props.showFanCount && props.saveCount > 0 && (
          <p className="text-sm text-zinc-500">
            <span className="text-white font-semibold">{props.saveCount.toLocaleString()}</span>{' '}
            {props.saveCount === 1 ? 'fan has' : 'fans have'} pre-saved this release
          </p>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center gap-1.5 text-zinc-600 text-xs">
          <Music2 className="w-3 h-3" />
          <span>Powered by FlyLink</span>
        </div>
      </div>
    </div>
  )
}
