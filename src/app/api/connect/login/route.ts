import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createLoginLink } from '@/lib/stripe/connect'

// Link to the artist's Stripe Express dashboard (payouts, transactions).
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  const accountId = (artist as { stripe_account_id?: string } | null)?.stripe_account_id
  if (!accountId) return NextResponse.json({ error: 'No payout account yet.' }, { status: 400 })

  const url = await createLoginLink(accountId)
  if (!url) return NextResponse.json({ error: 'Could not open Stripe dashboard.' }, { status: 500 })
  return NextResponse.json({ url })
}
