import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ embeds: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('media_embeds')
    .select('url, sort_order')
    .eq('artist_id', artist.id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ embeds: data ?? [] })
}

// Replace-all: send the full set of media embeds for this artist.
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const incoming = (body.embeds as { url: string }[]) ?? []
  const clean = incoming.filter((e) => e.url?.trim())

  const supabase = createAdminClient()
  await supabase.from('media_embeds').delete().eq('artist_id', artist.id)

  if (clean.length) {
    const { error } = await supabase.from('media_embeds').insert(
      clean.map((e, i) => ({ artist_id: artist.id, url: e.url.trim(), sort_order: i }))
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
