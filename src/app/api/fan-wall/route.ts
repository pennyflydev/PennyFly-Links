import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

// Dashboard: list all of the current artist's notes (pinned first).
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ notes: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('fan_wall_notes')
    .select('id, name, message, is_pinned, created_at')
    .eq('artist_id', artist.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return NextResponse.json({ notes: data ?? [] })
}

// Public: a fan leaves a note on an artist's wall.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { slug, name, message, website } = body as { slug?: string; name?: string; message?: string; website?: string }

  // Honeypot — bots fill hidden fields.
  if (website) return NextResponse.json({ ok: true })

  if (!slug || !message?.trim()) {
    return NextResponse.json({ error: 'A message is required' }, { status: 400 })
  }
  if (message.length > 280 || (name?.length ?? 0) > 60) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: artist } = await supabase
    .from('artists')
    .select('id, fan_wall_enabled')
    .eq('slug', slug)
    .single()

  if (!artist || !artist.fan_wall_enabled) {
    return NextResponse.json({ error: 'Fan wall is not available' }, { status: 404 })
  }

  const { error } = await supabase.from('fan_wall_notes').insert({
    artist_id: artist.id,
    name: name?.trim().slice(0, 60) || 'Anonymous',
    message: message.trim().slice(0, 280),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
