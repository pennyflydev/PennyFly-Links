// Spotify OAuth + library helpers for the pre-save / connect flow.

const AUTH_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'

// Email + library save + follow the artist.
export const SPOTIFY_SCOPES = ['user-read-email', 'user-library-modify', 'user-follow-modify'].join(' ')

function clientId() {
  return process.env.SPOTIFY_CLIENT_ID!
}
function redirectUri() {
  return process.env.SPOTIFY_REDIRECT_URI!
}
function basicAuth() {
  return Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
}

// App-only token (client credentials) for reading public catalog data.
export async function getAppToken(): Promise<string | null> {
  if (!process.env.SPOTIFY_CLIENT_ID) return null
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth()}` },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    next: { revalidate: 1800 },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { access_token?: string }
  return data.access_token ?? null
}

export function parseSpotifyArtistId(url: string): string | null {
  const m = url.match(/(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?artist\/|spotify:artist:)([a-zA-Z0-9]+)/)
  return m ? m[1] : null
}

// Public Spotify metrics for the analytics dashboard. NOTE: the public Web
// API does NOT expose stream counts or monthly listeners (those are Spotify
// for Artists only). This returns what the public API genuinely provides:
// total followers, a 0-100 popularity index, and top tracks by popularity.
export async function fetchArtistInsights(artistId: string) {
  const token = await getAppToken()
  if (!token) return null
  const headers = { Authorization: `Bearer ${token}` }

  const [artistRes, topRes] = await Promise.all([
    fetch(`${API}/artists/${artistId}`, { headers, next: { revalidate: 3600 } }),
    fetch(`${API}/artists/${artistId}/top-tracks?market=US`, { headers, next: { revalidate: 3600 } }),
  ])
  if (!artistRes.ok) return null

  const a = (await artistRes.json()) as {
    name: string
    images?: { url: string }[]
    genres?: string[]
    followers?: { total?: number }
    popularity?: number
    external_urls?: { spotify?: string }
  }
  const topTracks = topRes.ok
    ? ((await topRes.json()) as {
        tracks?: { name: string; popularity: number; external_urls?: { spotify?: string }; album?: { images?: { url: string }[] } }[]
      }).tracks ?? []
    : []

  return {
    name: a.name,
    image: a.images?.[0]?.url ?? null,
    url: a.external_urls?.spotify ?? null,
    genres: (a.genres ?? []).slice(0, 5),
    followers: a.followers?.total ?? 0,
    popularity: a.popularity ?? 0,
    topTracks: topTracks.slice(0, 5).map((t) => ({
      name: t.name,
      popularity: t.popularity,
      url: t.external_urls?.spotify ?? null,
      coverUrl: t.album?.images?.[t.album.images.length - 1]?.url ?? null,
    })),
  }
}

// Public artist profile (name, image, genres) + latest releases.
export async function fetchArtistProfile(artistId: string) {
  const token = await getAppToken()
  if (!token) return null
  const headers = { Authorization: `Bearer ${token}` }

  const [artistRes, albumsRes] = await Promise.all([
    fetch(`${API}/artists/${artistId}`, { headers }),
    fetch(`${API}/artists/${artistId}/albums?include_groups=album,single&market=US&limit=8`, { headers }),
  ])
  if (!artistRes.ok) return null

  const a = (await artistRes.json()) as { name: string; images?: { url: string }[]; genres?: string[] }
  const albums = albumsRes.ok
    ? ((await albumsRes.json()) as { items?: { name: string; images?: { url: string }[]; external_urls?: { spotify?: string } }[] }).items ?? []
    : []

  // De-dupe releases by name (albums endpoint repeats across markets).
  const seen = new Set<string>()
  const releases = albums
    .filter((r) => (seen.has(r.name) ? false : seen.add(r.name)))
    .map((r) => ({ title: r.name, coverUrl: r.images?.[0]?.url ?? null, spotifyUrl: r.external_urls?.spotify ?? null }))

  return {
    name: a.name,
    image: a.images?.[0]?.url ?? null,
    genres: (a.genres ?? []).slice(0, 5),
    releases,
  }
}

export function getAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: clientId(),
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: 'false',
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCode(code: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth()}` },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri() }),
  })
  if (!res.ok) return null
  return (await res.json()) as { access_token: string; refresh_token: string; expires_in: number }
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth()}` },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  if (!res.ok) return null
  return (await res.json()) as { access_token: string; expires_in: number }
}

export async function getMe(accessToken: string) {
  const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) return null
  return (await res.json()) as { id: string; email?: string; country?: string; display_name?: string }
}

export async function saveToLibrary(accessToken: string, type: 'album' | 'track', id: string) {
  const path = type === 'album' ? 'albums' : 'tracks'
  const res = await fetch(`${API}/me/${path}?ids=${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  })
  return res.ok
}

// Best-effort: look up the primary artist of an album/track and follow them.
export async function followReleaseArtist(accessToken: string, type: 'album' | 'track', id: string) {
  try {
    const path = type === 'album' ? 'albums' : 'tracks'
    const res = await fetch(`${API}/${path}/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) return
    const data = await res.json()
    const artistId = data?.artists?.[0]?.id
    if (!artistId) return
    await fetch(`${API}/me/following?type=artist&ids=${artistId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    // non-fatal
  }
}

// Parse a Spotify URL or URI into { type, id }. Supports album/track.
export function parseSpotifyTarget(url?: string | null): { type: 'album' | 'track'; id: string } | null {
  if (!url) return null
  const m = url.match(/(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?|spotify:)(album|track)[/:]([a-zA-Z0-9]+)/)
  if (!m) return null
  return { type: m[1] as 'album' | 'track', id: m[2] }
}
