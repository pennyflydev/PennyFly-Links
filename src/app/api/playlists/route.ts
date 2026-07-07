import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ playlists: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('playlist_spotlights')
    .select('title, spotify_url, cover_url, sort_order')
    .eq('artist_id', artist.id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ playlists: data ?? [] })
}

// Replace-all: send the full set of playlist spotlights for this artist.
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const incoming = (body.playlists as { title: string; spotify_url: string; cover_url?: string }[]) ?? []
  const clean = incoming.filter((p) => p.spotify_url?.trim())

  const supabase = createAdminClient()
  await supabase.from('playlist_spotlights').delete().eq('artist_id', artist.id)

  if (clean.length) {
    const { error } = await supabase.from('playlist_spotlights').insert(
      clean.map((p, i) => ({
        artist_id: artist.id,
        title: p.title?.trim() || 'Playlist',
        spotify_url: p.spotify_url.trim(),
        cover_url: p.cover_url?.trim() || null,
        sort_order: i,
      }))
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
