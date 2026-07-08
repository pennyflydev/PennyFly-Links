import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { isBillingConfigured } from '@/lib/stripe'
import { createConnectAccount, createOnboardingLink } from '@/lib/stripe/connect'

// Start (or resume) Stripe Connect onboarding for the current artist.
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isBillingConfigured()) {
    return NextResponse.json({ error: 'Payments aren’t configured yet.' }, { status: 503 })
  }

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const supabase = createAdminClient()
  let accountId = (artist as { stripe_account_id?: string }).stripe_account_id ?? null

  // Create the connected account on first use.
  if (!accountId) {
    const profile = await getCurrentProfile()
    const { data: profileRow } = await supabase.from('profiles').select('email').eq('id', profile?.id ?? '').single()
    accountId = await createConnectAccount(profileRow?.email ?? null)
    if (!accountId) return NextResponse.json({ error: 'Could not create payout account.' }, { status: 500 })
    await supabase.from('artists').update({ stripe_account_id: accountId }).eq('id', artist.id)
  }

  const url = await createOnboardingLink(accountId)
  if (!url) return NextResponse.json({ error: 'Could not start onboarding.' }, { status: 500 })

  return NextResponse.json({ url })
}
