import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

// List ticket types for an event the artist owns.
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ ticketTypes: [] })

  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId)
    .eq('artist_id', artist.id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ ticketTypes: data ?? [] })
}

// Create a ticket type on an event the artist owns.
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { eventId, name, priceCents, quantity } = await req.json()
  if (!eventId || !name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const supabase = createAdminClient()
  // Verify the event belongs to this artist.
  const { data: event } = await supabase.from('events').select('id').eq('id', eventId).eq('artist_id', artist.id).single()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('ticket_types')
    .insert({
      event_id: eventId,
      artist_id: artist.id,
      name: name.trim(),
      price_cents: Math.max(0, Math.round(Number(priceCents) || 0)),
      quantity: quantity === null || quantity === '' || quantity === undefined ? null : Math.max(0, Math.round(Number(quantity))),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ticketType: data }, { status: 201 })
}
