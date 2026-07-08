// Bandsintown public Artist Events API.
// Docs: https://rest.bandsintown.com  — needs an app_id (free). We read it
// from BANDSINTOWN_APP_ID and fall back to a generic id.

const API = 'https://rest.bandsintown.com'

export interface NormalizedEvent {
  externalId: string
  title: string
  startAt: string // ISO
  venue: string
  city: string
  ticketUrl: string | null
  description: string
}

type RawEvent = {
  id: string
  title?: string
  datetime: string
  description?: string
  url?: string
  venue?: { name?: string; city?: string; region?: string; country?: string }
  offers?: { type?: string; url?: string; status?: string }[]
}

// Accepts a raw handle ("Coldplay"), or a bandsintown URL
// (bandsintown.com/a/12345-name, bandsintown.com/artist/name, or .../name).
export function parseBandsintownArtist(input: string): string {
  const raw = input.trim()
  if (!raw) return ''
  const urlMatch = raw.match(/bandsintown\.com\/(?:a\/|artist\/)?([^/?#]+)/i)
  if (urlMatch) {
    // "12345-artist-name" -> drop the leading numeric id if present
    return decodeURIComponent(urlMatch[1]).replace(/^\d+-/, '').replace(/-/g, ' ')
  }
  return raw
}

function cityLabel(v: RawEvent['venue']): string {
  if (!v) return ''
  return [v.city, v.region || v.country].filter(Boolean).join(', ')
}

export async function fetchBandsintownEvents(artist: string): Promise<NormalizedEvent[]> {
  const appId = process.env.BANDSINTOWN_APP_ID || 'flylink'
  const name = encodeURIComponent(artist.trim())
  const res = await fetch(`${API}/artists/${name}/events?app_id=${appId}&date=upcoming`, {
    headers: { Accept: 'application/json' },
    // tour data changes slowly; cache briefly to be polite to the API
    next: { revalidate: 600 },
  })
  if (!res.ok) return []

  let data: unknown
  try {
    data = await res.json()
  } catch {
    return []
  }
  // The API returns an array of events, or an object with a warn/error message.
  if (!Array.isArray(data)) return []

  return (data as RawEvent[])
    .filter((e) => e?.id && e?.datetime)
    .map((e) => {
      const venue = e.venue?.name?.trim() || ''
      const city = cityLabel(e.venue)
      const ticket = e.offers?.find((o) => o.type === 'Tickets' && o.url)?.url || e.url || null
      const title = e.title?.trim() || (venue ? `Live at ${venue}` : city ? `Live in ${city}` : 'Live show')
      return {
        externalId: String(e.id),
        title,
        startAt: e.datetime,
        venue,
        city,
        ticketUrl: ticket,
        description: e.description?.trim() || '',
      }
    })
}
