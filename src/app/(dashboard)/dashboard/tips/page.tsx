import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import { isBillingConfigured } from '@/lib/stripe'
import TipsClient from './TipsClient'

type Tip = {
  id: string
  amount_cents: number
  supporter_name: string | null
  message: string | null
  created_at: string
}

export default async function TipsPage() {
  const artist = await getArtistForCurrentUser()

  let enabled = false
  let chargesEnabled = false
  let tips: Tip[] = []
  let total = 0

  if (artist) {
    const a = artist as { tips_enabled?: boolean; stripe_charges_enabled?: boolean }
    enabled = !!a.tips_enabled
    chargesEnabled = !!a.stripe_charges_enabled

    const supabase = createAdminClient()
    const { data } = await supabase
      .from('tips')
      .select('id, amount_cents, supporter_name, message, created_at')
      .eq('artist_id', artist.id)
      .order('created_at', { ascending: false })
      .limit(100)
    tips = (data as Tip[]) ?? []
    total = tips.reduce((sum, t) => sum + t.amount_cents, 0)
  }

  return (
    <TipsClient
      initialEnabled={enabled}
      chargesEnabled={chargesEnabled}
      billingReady={isBillingConfigured()}
      tips={tips}
      total={total}
    />
  )
}
