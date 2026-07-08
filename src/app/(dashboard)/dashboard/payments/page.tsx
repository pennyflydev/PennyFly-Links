import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import { isBillingConfigured } from '@/lib/stripe'
import { getAccountStatus, PLATFORM_FEE_BPS } from '@/lib/stripe/connect'
import PaymentsClient from './PaymentsClient'

export default async function PaymentsPage() {
  const artist = await getArtistForCurrentUser()
  const accountId = (artist as { stripe_account_id?: string } | null)?.stripe_account_id ?? null

  let chargesEnabled = !!(artist as { stripe_charges_enabled?: boolean } | null)?.stripe_charges_enabled
  let detailsSubmitted = false

  // If they have an account, refresh live status from Stripe (so returning from
  // onboarding reflects immediately, not only after the webhook fires).
  if (artist && accountId && isBillingConfigured()) {
    const status = await getAccountStatus(accountId)
    if (status) {
      chargesEnabled = status.chargesEnabled
      detailsSubmitted = status.detailsSubmitted
      if (status.chargesEnabled !== (artist as { stripe_charges_enabled?: boolean }).stripe_charges_enabled) {
        await createAdminClient().from('artists').update({ stripe_charges_enabled: status.chargesEnabled }).eq('id', artist.id)
      }
    }
  }

  return (
    <PaymentsClient
      billingReady={isBillingConfigured()}
      hasAccount={!!accountId}
      chargesEnabled={chargesEnabled}
      detailsSubmitted={detailsSubmitted}
      feePercent={PLATFORM_FEE_BPS / 100}
    />
  )
}
