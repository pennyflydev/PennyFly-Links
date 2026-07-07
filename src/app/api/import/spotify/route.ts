import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseSpotifyArtistId, fetchArtistProfile } from '@/lib/spotify'

// Given a Spotify artist URL, return their public profile to pre-fill the page.
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url') ?? ''
  const artistId = parseSpotifyArtistId(url)
  if (!artistId) return NextResponse.json({ error: 'Paste a Spotify artist link' }, { status: 400 })

  const profile = await fetchArtistProfile(artistId)
  if (!profile) return NextResponse.json({ error: 'Could not fetch from Spotify' }, { status: 502 })

  return NextResponse.json(profile)
}
