import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import { isTwilioConfigured } from '@/lib/sms/twilio'
import SmsClient from './SmsClient'

export default async function SmsPage() {
  const artist = await getArtistForCurrentUser()

  let activeCount = 0
  let totalCount = 0
  let enabled = false

  if (artist) {
    const supabase = createAdminClient()
    enabled = !!(artist as { sms_enabled?: boolean }).sms_enabled
    const [{ count: active }, { count: total }] = await Promise.all([
      supabase.from('sms_subscribers').select('id', { count: 'exact', head: true }).eq('artist_id', artist.id).eq('status', 'active'),
      supabase.from('sms_subscribers').select('id', { count: 'exact', head: true }).eq('artist_id', artist.id),
    ])
    activeCount = active ?? 0
    totalCount = total ?? 0
  }

  return (
    <SmsClient
      initialEnabled={enabled}
      activeCount={activeCount}
      totalCount={totalCount}
      twilioReady={isTwilioConfigured()}
    />
  )
}
