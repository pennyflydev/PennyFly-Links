import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

// Scan a ticket at the door. First scan wins: a valid ticket flips to 'used'
// atomically, so a second scan reports "already used".
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { token, eventId } = await req.json().catch(() => ({}))
  if (!token) return NextResponse.json({ result: 'invalid', reason: 'No code' })

  const supabase = createAdminClient()
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, status, buyer_name, checked_in_at, event_id, artist_id, ticket_types(name), events(title)')
    .eq('token', String(token).trim())
    .maybeSingle()

  // Must exist and belong to this artist (and the event being scanned, if given).
  if (!ticket || ticket.artist_id !== artist.id || (eventId && ticket.event_id !== eventId)) {
    return NextResponse.json({ result: 'invalid', reason: 'Not a valid ticket for this event' })
  }

  const info = {
    buyerName: ticket.buyer_name ?? null,
    ticketType: (ticket.ticket_types as unknown as { name: string } | null)?.name ?? 'Ticket',
    eventTitle: (ticket.events as unknown as { title: string } | null)?.title ?? '',
  }

  if (ticket.status === 'refunded') {
    return NextResponse.json({ result: 'invalid', reason: 'Ticket was refunded', ...info })
  }
  if (ticket.status === 'used') {
    return NextResponse.json({ result: 'used', checkedInAt: ticket.checked_in_at, ...info })
  }

  // Atomic redeem: only succeeds if still 'valid'.
  const now = new Date().toISOString()
  const { data: updated } = await supabase
    .from('tickets')
    .update({ status: 'used', checked_in_at: now })
    .eq('id', ticket.id)
    .eq('status', 'valid')
    .select('id')

  if (!updated || updated.length === 0) {
    // Someone else scanned it a moment ago.
    return NextResponse.json({ result: 'used', checkedInAt: now, ...info })
  }

  return NextResponse.json({ result: 'valid', checkedInAt: now, ...info })
}
