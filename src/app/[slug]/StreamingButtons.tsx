'use client'

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

export default function StreamingButtons({
  artistId,
  promoLinkId,
  links,
  radiusClass = 'rounded-xl',
}: {
  artistId: string
  promoLinkId: string
  links: { platform: string; url: string }[]
  radiusClass?: string
}) {
  function trackClick(platform: string) {
    // keepalive lets the request finish even as the browser opens the link
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistId, eventType: 'click', promoLinkId, platform }),
      keepalive: true,
    }).catch(() => {})
  }

  return (
    <div className="px-4 pb-4 grid grid-cols-2 gap-2">
      {links.map((sl) => {
        // Spotify routes through our OAuth connector so we capture the fan's
        // verified email + save the track. Other platforms open directly.
        const isSpotify = sl.platform === 'spotify'
        const href = isSpotify ? `/api/auth/spotify/start?type=link&id=${promoLinkId}` : sl.url
        return (
          <a
            key={sl.platform}
            href={href}
            target={isSpotify ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={() => trackClick(sl.platform)}
            className={`flex items-center justify-center gap-2 py-2.5 ${radiusClass} text-white text-sm font-semibold transition-colors ${PLATFORM_COLORS[sl.platform] ?? 'bg-zinc-700 hover:bg-zinc-600'}`}
          >
            {PLATFORM_LABELS[sl.platform] ?? sl.platform}
          </a>
        )
      })}
    </div>
  )
}
