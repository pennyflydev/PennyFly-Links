import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { normalizePhone, sendSms, isTwilioConfigured } from '@/lib/sms/twilio'

// Fan opts in to an artist's SMS drop alerts. Requires explicit consent.
export async function POST(req: NextRequest) {
  const { slug, phone, consent } = await req.json().catch(() => ({}))

  if (!consent) return NextResponse.json({ error: 'Please agree to receive texts.' }, { status: 400 })
  if (!slug) return NextResponse.json({ error: 'Missing artist' }, { status: 400 })

  const normalized = normalizePhone(String(phone ?? ''))
  if (!normalized) return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: artist } = await supabase
    .from('artists')
    .select('id, artist_name, sms_enabled')
    .eq('slug', slug)
    .single()

  if (!artist || !artist.sms_enabled) {
    return NextResponse.json({ error: 'SMS alerts are not available for this artist.' }, { status: 404 })
  }

  // Upsert as active (re-subscribing flips a previously-unsubscribed row back).
  const { error } = await supabase.from('sms_subscribers').upsert(
    { artist_id: artist.id, phone: normalized, status: 'active', consent_at: new Date().toISOString(), source: 'page' },
    { onConflict: 'artist_id,phone' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Confirmation text (only if Twilio is live). Includes required STOP notice.
  if (isTwilioConfigured()) {
    await sendSms(
      normalized,
      `You're subscribed to ${artist.artist_name || 'FlyLink'} drop alerts. Msg&data rates may apply. Reply STOP to opt out, HELP for help.`
    )
  }

  return NextResponse.json({ ok: true })
}
