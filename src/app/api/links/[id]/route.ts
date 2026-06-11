import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('promo_links')
    .select('*, streaming_links(*)')
    .eq('id', id)
    .eq('artist_id', artist.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ link: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()

  // streamingLinks is handled separately (replace-all); everything else updates promo_links.
  const { streamingLinks, ...fields } = body

  if (Object.keys(fields).length > 0) {
    const { error } = await supabase
      .from('promo_links')
      .update(fields)
      .eq('id', id)
      .eq('artist_id', artist.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (Array.isArray(streamingLinks)) {
    // Confirm ownership before touching child rows.
    const { data: owned } = await supabase
      .from('promo_links')
      .select('id')
      .eq('id', id)
      .eq('artist_id', artist.id)
      .single()
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await supabase.from('streaming_links').delete().eq('promo_link_id', id)
    const clean = (streamingLinks as { platform: string; url: string }[]).filter((l) => l.url?.trim())
    if (clean.length) {
      await supabase.from('streaming_links').insert(
        clean.map((l, i) => ({ promo_link_id: id, platform: l.platform, url: l.url.trim(), sort_order: i }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('promo_links')
    .delete()
    .eq('id', id)
    .eq('artist_id', artist.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
