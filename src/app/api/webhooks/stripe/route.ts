import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { getStripe, planForPriceId } from '@/lib/stripe'

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
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await applySubscription(event.data.object as Stripe.Subscription)
      break
    }
  }

  return NextResponse.json({ received: true })
}
