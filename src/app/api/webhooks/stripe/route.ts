import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { getStripe, planForPriceId } from '@/lib/stripe'
import { sendTicketEmail, sendPurchaseEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Apply a subscription's state to the owning profile.
  async function applySubscription(sub: Stripe.Subscription) {
    const priceId = sub.items.data[0]?.price?.id
    const plan = planForPriceId(priceId)
    const periodEnd = sub.items.data[0]?.current_period_end ?? null
    const updates: Record<string, unknown> = {
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    }
    // Active/trialing subscriptions set the plan; ended ones fall back to starter.
    if (sub.status === 'active' || sub.status === 'trialing') {
      if (plan) updates.plan = plan
    } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
      updates.plan = 'starter'
    }
    await supabase.from('profiles').update(updates).eq('stripe_customer_id', sub.customer as string)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        await applySubscription(sub)
      } else if (session.metadata?.kind === 'tip') {
        // Log the completed tip (idempotent on the checkout session id).
        const m = session.metadata
        const { data: existing } = await supabase.from('tips').select('id').eq('order_id', session.id).maybeSingle()
        if (!existing) {
          await supabase.from('tips').insert({
            artist_id: m.artistId,
            amount_cents: session.amount_total ?? 0,
            supporter_name: m.supporterName ?? null,
            message: m.message ?? null,
            order_id: session.id,
          })
        }
      } else if (session.metadata?.kind === 'product') {
        // Record the store purchase (idempotent on session id) and receipt the buyer.
        const m = session.metadata
        const { data: existing } = await supabase.from('purchases').select('id').eq('order_id', session.id).maybeSingle()
        if (!existing) {
          const buyerEmail = session.customer_details?.email ?? null
          const buyerName = session.customer_details?.name ?? null
          await supabase.from('purchases').insert({
            artist_id: m.artistId,
            product_id: m.productId,
            amount_cents: session.amount_total ?? 0,
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            order_id: session.id,
          })

          // Email a receipt with the access link (no-op unless email is configured).
          const { data: product } = await supabase
            .from('products')
            .select('title, buy_url, artists(artist_name)')
            .eq('id', m.productId)
            .single()
          const artist = product?.artists as unknown as { artist_name: string } | null
          await sendPurchaseEmail({
            buyerName,
            buyerEmail,
            productTitle: product?.title ?? 'Your purchase',
            amountCents: session.amount_total ?? 0,
            accessUrl: product?.buy_url ?? null,
            artistName: artist?.artist_name ?? 'the artist',
          }).catch(() => {})
        }
      } else if (session.metadata?.kind === 'paid_unlock') {
        // Record the paid unlock (idempotent) and email the reward link.
        const m = session.metadata
        const { data: existing } = await supabase.from('unlocks').select('id').eq('order_id', session.id).maybeSingle()
        if (!existing) {
          const buyerEmail = session.customer_details?.email ?? null
          const buyerName = session.customer_details?.name ?? null
          await supabase.from('unlocks').insert({
            exclusive_id: m.exclusiveId,
            artist_id: m.artistId,
            amount_cents: session.amount_total ?? 0,
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            order_id: session.id,
          })

          const { data: item } = await supabase
            .from('exclusive_content')
            .select('title, reward_url, artists(artist_name)')
            .eq('id', m.exclusiveId)
            .single()
          const artist = item?.artists as unknown as { artist_name: string } | null
          await sendPurchaseEmail({
            buyerName,
            buyerEmail,
            productTitle: item?.title ?? 'Your unlock',
            amountCents: session.amount_total ?? 0,
            accessUrl: item?.reward_url ?? null,
            artistName: artist?.artist_name ?? 'the artist',
          }).catch(() => {})
        }
      } else if (session.metadata?.kind === 'ticket') {
        // Issue the paid ticket now that payment succeeded (idempotent on order_id).
        const m = session.metadata
        const { data: existing } = await supabase.from('tickets').select('id').eq('order_id', session.id).maybeSingle()
        if (!existing) {
          const token = randomBytes(16).toString('hex')
          const buyerEmail = m.buyerEmail ?? session.customer_details?.email ?? null
          const { error } = await supabase.from('tickets').insert({
            event_id: m.eventId,
            artist_id: m.artistId,
            ticket_type_id: m.ticketTypeId,
            token,
            buyer_name: m.buyerName ?? null,
            buyer_email: buyerEmail,
            status: 'valid',
            order_id: session.id,
          })
          if (!error) {
            const { data: tt } = await supabase
              .from('ticket_types')
              .select('sold, name, events(title, start_at, venue, city)')
              .eq('id', m.ticketTypeId)
              .single()
            if (tt) await supabase.from('ticket_types').update({ sold: tt.sold + 1 }).eq('id', m.ticketTypeId)

            // Email the ticket link to the buyer (no-op unless email is configured).
            const event = tt?.events as unknown as { title: string; start_at: string | null; venue: string | null; city: string | null } | null
            await sendTicketEmail({
              token,
              buyerName: m.buyerName ?? null,
              buyerEmail,
              eventTitle: event?.title ?? 'Event',
              startAt: event?.start_at ?? null,
              venue: event?.venue ?? null,
              city: event?.city ?? null,
              ticketType: tt?.name ?? 'Ticket',
            }).catch(() => {})
          }
        }
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await applySubscription(event.data.object as Stripe.Subscription)
      break
    }
    // Stripe Connect: keep the artist's payout-readiness in sync.
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      await supabase
        .from('artists')
        .update({ stripe_charges_enabled: !!account.charges_enabled })
        .eq('stripe_account_id', account.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
