import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { fetchBandsintownEvents, parseBandsintownArtist } from '@/lib/bandsintown'
import { slugify } from '@/lib/utils'

// Import (and re-sync) an artist's Bandsintown tour dates into Events.
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const handle = parseBandsintownArtist(String(body.artist ?? ''))
  if (!handle) return NextResponse.json({ error: 'Enter your Bandsintown artist name' }, { status: 400 })

  const supabase = createAdminClient()

  // Remember the handle for next time.
  await supabase.from('artists').update({ bandsintown_artist: handle }).eq('id', artist.id)

  const events = await fetchBandsintownEvents(handle)
  if (events.length === 0) {
    return NextResponse.json({ imported: 0, updated: 0, total: 0, message: 'No upcoming shows found for that artist.' })
  }

  // Existing imported events for this artist, keyed by Bandsintown id.
  const { data: existing } = await supabase
    .from('events')
    .select('id, external_id')
    .eq('artist_id', artist.id)
    .not('external_id', 'is', null)
  const byExt = new Map((existing ?? []).map((e) => [e.external_id as string, e.id as string]))

  let imported = 0
  let updated = 0

  for (const ev of events) {
    const known = byExt.get(ev.externalId)
    if (known) {
      // Refresh the details that commonly change (date/venue/tickets).
      await supabase
        .from('events')
        .update({
          title: ev.title,
          start_at: ev.startAt,
          venue: ev.venue,
          city: ev.city,
          ticket_url: ev.ticketUrl,
        })
        .eq('id', known)
      updated++
      continue
    }

    // New event → globally-unique slug from the venue/title + a short id.
    const base = `${slugify(ev.title) || 'show'}-${ev.externalId.slice(-6)}`
    let slug = base
    let n = 0
    while (n < 6) {
      const { data: clash } = await supabase.from('events').select('id').eq('slug', slug).single()
      if (!clash) break
      n++
      slug = `${base}-${n}`
    }

    const { error } = await supabase.from('events').insert({
      artist_id: artist.id,
      title: ev.title,
      slug,
      description: ev.description,
      start_at: ev.startAt,
      venue: ev.venue,
      city: ev.city,
      ticket_url: ev.ticketUrl,
      is_published: true,
      source: 'bandsintown',
      external_id: ev.externalId,
    })
    if (!error) imported++
  }

  return NextResponse.json({ imported, updated, total: events.length })
}
