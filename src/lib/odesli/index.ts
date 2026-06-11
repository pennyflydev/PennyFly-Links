import type { OdesliResponse, StreamingPlatform } from '@/types'

const ODESLI_API = 'https://api.song.link/v1-alpha.1/links'

// Maps Odesli platform keys to our internal platform names
const PLATFORM_MAP: Record<string, StreamingPlatform> = {
  spotify: 'spotify',
  appleMusic: 'apple_music',
  youtubeMusic: 'youtube_music',
  tidal: 'tidal',
  amazon: 'amazon_music',
  deezer: 'deezer',
  bandcamp: 'bandcamp',
  soundcloud: 'soundcloud',
}

export interface ParsedStreamingLinks {
  platform: StreamingPlatform
  url: string
}

export interface OdesliResult {
  title: string | null
  artistName: string | null
  thumbnailUrl: string | null
  links: ParsedStreamingLinks[]
}

export async function fetchStreamingLinks(url: string): Promise<OdesliResult | null> {
  try {
    const res = await fetch(`${ODESLI_API}?url=${encodeURIComponent(url)}&userCountry=US`)
    if (!res.ok) return null

    const data: OdesliResponse = await res.json()

    // Pull metadata from the first entity
    const firstEntity = Object.values(data.entitiesByUniqueId)[0]

    const links: ParsedStreamingLinks[] = Object.entries(data.linksByPlatform)
      .filter(([key]) => PLATFORM_MAP[key])
      .map(([key, value]) => ({
        platform: PLATFORM_MAP[key],
        url: value.url,
      }))

    return {
      title: firstEntity?.title ?? null,
      artistName: firstEntity?.artistName ?? null,
      thumbnailUrl: firstEntity?.thumbnailUrl ?? null,
      links,
    }
  } catch {
    return null
  }
}
