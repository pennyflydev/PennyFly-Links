import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { newTicketToken } from '@/lib/tickets'

// Claim a FREE ticket (RSVP). Paid tickets go through /api/tickets/checkout.
export async function POST(req: NextRequest) {
  const { ticketTypeId, name, email } = await req.json().catch(() => ({}))
  if (!ticketTypeId) return NextResponse.json({ error: 'Missing ticket type' }, { status: 400 })
  if (!name?.trim() || !email?.trim()) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: type } = await supabase
    .from('ticket_types')
    .select('id, event_id, artist_id, price_cents, quantity, sold, is_active')
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

  return NextResponse.json({ token })
}
