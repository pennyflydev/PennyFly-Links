import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'
import { getStripe, priceId, type PlanId, type Interval } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'Billing is not configured yet' }, { status: 503 })

  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, interval } = (await req.json()) as { plan: PlanId; interval: Interval }
  const price = priceId(plan, interval)
  if (!price) return NextResponse.json({ error: 'That plan is not available yet' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: full } = await supabase
    .from('profiles')
    .select('id, email, stripe_customer_id')
    .eq('id', profile.id)
    .single()
  if (!full) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Reuse or create the Stripe customer.
  let customerId = full.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: full.email, metadata: { profileId: full.id } })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', full.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://penny-fly-links.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: full.id,
    metadata: { profileId: full.id, plan },
    subscription_data: { metadata: { profileId: full.id, plan } },
    success_url: `${appUrl}/dashboard/settings?billing=success`,
    cancel_url: `${appUrl}/dashboard/settings?billing=cancelled`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
