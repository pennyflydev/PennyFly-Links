import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { parseSpotifyArtistId } from '@/lib/spotify'

// Connect (or clear) the artist's Spotify profile for insights.
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { url } = await req.json().catch(() => ({}))

  // Empty string disconnects.
  if (!url || !String(url).trim()) {
    const supabase = createAdminClient()
    await supabase.from('artists').update({ spotify_artist_id: null }).eq('id', artist.id)
    return NextResponse.json({ spotifyArtistId: null })
  }

  const id = parseSpotifyArtistId(String(url).trim())
  if (!id) {
    return NextResponse.json({ error: 'That doesn’t look like a Spotify artist link. Copy the URL from the artist’s Spotify page.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('artists').update({ spotify_artist_id: id }).eq('id', artist.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ spotifyArtistId: id })
}
