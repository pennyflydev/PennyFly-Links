import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isBillingConfigured } from '@/lib/stripe'
import { createConnectCheckout } from '@/lib/stripe/connect'

// Buy a PAID ticket. Creates a Connect checkout; the ticket itself is issued
// by the Stripe webhook once payment completes (see /api/webhooks/stripe).
export async function POST(req: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: 'Payments aren’t available right now.' }, { status: 503 })
  }

  const { ticketTypeId, name, email } = await req.json().catch(() => ({}))
  if (!ticketTypeId) return NextResponse.json({ error: 'Missing ticket type' }, { status: 400 })
  if (!name?.trim() || !email?.trim()) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: type } = await supabase
    .from('ticket_types')
    .select('id, name, event_id, artist_id, price_cents, quantity, sold, is_active, events(title, slug)')
    .eq('id', ticketTypeId)
    .single()

  if (!type || !type.is_active) return NextResponse.json({ error: 'Ticket not available' }, { status: 404 })
  if (type.price_cents <= 0) return NextResponse.json({ error: 'This ticket is free — no payment needed.' }, { status: 400 })
  if (type.quantity != null && type.sold >= type.quantity) return NextResponse.json({ error: 'Sold out.' }, { status: 409 })

  const { data: artist } = await supabase
    .from('artists')
    .select('slug, stripe_account_id, stripe_charges_enabled')
    .eq('id', type.artist_id)
    .single()
  if (!artist?.stripe_account_id || !artist.stripe_charges_enabled) {
    return NextResponse.json({ error: 'This artist isn’t set up to take payments yet.' }, { status: 400 })
  }

  const event = type.events as unknown as { title: string; slug: string } | null
  const origin = process.env.NEXT_PUBLIC_PROD_URL || process.env.NEXT_PUBLIC_APP_URL || ''

  const url = await createConnectCheckout({
    destinationAccountId: artist.stripe_account_id,
    amountCents: type.price_cents,
    productName: `${event?.title ?? 'Event'} — ${type.name}`,
    metadata: {
      kind: 'ticket',
      ticketTypeId: type.id,
      eventId: type.event_id,
      artistId: type.artist_id,
      buyerName: name.trim().slice(0, 120),
      buyerEmail: email.trim().slice(0, 200),
    },
    successUrl: `${origin}/ticket/success?s={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/events/${event?.slug ?? ''}?ticket=cancelled`,
  })
  if (!url) return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
  return NextResponse.json({ url })
}
