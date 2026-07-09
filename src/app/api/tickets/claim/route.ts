import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { newTicketToken } from '@/lib/tickets'
import { sendTicketEmail } from '@/lib/email'

// Claim a FREE ticket (RSVP). Paid tickets go through /api/tickets/checkout.
export async function POST(req: NextRequest) {
  const { ticketTypeId, name, email } = await req.json().catch(() => ({}))
  if (!ticketTypeId) return NextResponse.json({ error: 'Missing ticket type' }, { status: 400 })
  if (!name?.trim() || !email?.trim()) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: type } = await supabase
    .from('ticket_types')
    .select('id, name, event_id, artist_id, price_cents, quantity, sold, is_active, events(title, start_at, venue, city)')
    .eq('id', ticketTypeId)
    .single()

  if (!type || !type.is_active) return NextResponse.json({ error: 'Ticket not available' }, { status: 404 })
  if (type.price_cents > 0) return NextResponse.json({ error: 'This ticket requires payment.' }, { status: 400 })
  if (type.quantity != null && type.sold >= type.quantity) {
    return NextResponse.json({ error: 'Sold out.' }, { status: 409 })
  }

  const token = newTicketToken()
  const { error } = await supabase.from('tickets').insert({
    event_id: type.event_id,
    artist_id: type.artist_id,
    ticket_type_id: type.id,
    token,
    buyer_name: name.trim(),
    buyer_email: email.trim(),
    status: 'valid',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('ticket_types').update({ sold: type.sold + 1 }).eq('id', type.id)

  // Email the ticket link to the buyer (no-op unless email is configured).
  const event = type.events as unknown as { title: string; start_at: string | null; venue: string | null; city: string | null } | null
  await sendTicketEmail({
    token,
    buyerName: name.trim(),
    buyerEmail: email.trim(),
    eventTitle: event?.title ?? 'Event',
    startAt: event?.start_at ?? null,
    venue: event?.venue ?? null,
    city: event?.city ?? null,
    ticketType: type.name,
  }).catch(() => {})

  return NextResponse.json({ token })
}
