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
