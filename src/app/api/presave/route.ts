import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { slugify } from '@/lib/utils'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ campaigns: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('presave_campaigns')
    .select('*')
    .eq('artist_id', artist.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const { title, slug, artistName, coverUrl, releaseDate, spotifyUrl, description, showCounter } = body

  if (!title || !releaseDate) {
    return NextResponse.json({ error: 'Title and release date required' }, { status: 400 })
  }

  const finalSlug = slug || slugify(title)
  const supabase = createAdminClient()

  const { data: campaign, error } = await supabase
    .from('presave_campaigns')
    .insert({
      artist_id: artist.id,
      title,
      slug: finalSlug,
      cover_url: coverUrl ?? null,
      release_date: releaseDate,
      spotify_url: spotifyUrl || null,
      description: description || '',
      show_fan_count: showCounter ?? true,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign }, { status: 201 })
}
