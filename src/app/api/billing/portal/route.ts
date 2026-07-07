import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'Billing is not configured yet' }, { status: 503 })

  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: full } = await supabase.from('profiles').select('stripe_customer_id').eq('id', profile.id).single()
  if (!full?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account yet' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://penny-fly-links.vercel.app'
  const session = await stripe.billingPortal.sessions.create({
    customer: full.stripe_customer_id,
    return_url: `${appUrl}/dashboard/settings`,
  })

  return NextResponse.json({ url: session.url })
}
