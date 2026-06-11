import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ links: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('social_links')
    .select('platform, url, sort_order')
    .eq('artist_id', artist.id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ links: data ?? [] })
}

// Replace-all: send the full set of social links for this artist.
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const incoming = (body.links as { platform: string; url: string }[]) ?? []
  const clean = incoming.filter((l) => l.platform?.trim() && l.url?.trim())

  const supabase = createAdminClient()
  await supabase.from('social_links').delete().eq('artist_id', artist.id)

  if (clean.length) {
    const { error } = await supabase.from('social_links').insert(
      clean.map((l, i) => ({
        artist_id: artist.id,
        platform: l.platform.trim(),
        url: l.url.trim(),
        sort_order: i,
      }))
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
