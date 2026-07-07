import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { slugify } from '@/lib/utils'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ events: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('artist_id', artist.id)
    .order('start_at', { ascending: true })

  return NextResponse.json({ events: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const { title, description, coverUrl, startAt, venue, city, ticketUrl, publish } = body

  if (!title || !startAt) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Globally-unique slug.
  const base = slugify(title) || `event-${Date.now().toString(36)}`
  let slug = base
  let n = 0
  while (n < 6) {
    const { data: existing } = await supabase.from('events').select('id').eq('slug', slug).single()
    if (!existing) break
    n++
    slug = `${base}-${n}`
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      artist_id: artist.id,
      title,
      slug,
      description: description ?? '',
      cover_url: coverUrl ?? null,
      start_at: startAt,
      venue: venue ?? '',
      city: city ?? '',
      ticket_url: ticketUrl || null,
      is_published: publish ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event }, { status: 201 })
}
