import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { sendSms, isTwilioConfigured } from '@/lib/sms/twilio'

// Artist blasts a drop alert to their opted-in SMS subscribers.
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  if (!isTwilioConfigured()) {
    return NextResponse.json({ error: 'SMS sending isn’t configured yet.' }, { status: 503 })
  }

  const { message } = await req.json().catch(() => ({}))
  const text = String(message ?? '').trim()
  if (!text) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 })
  if (text.length > 320) return NextResponse.json({ error: 'Keep it under 320 characters.' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('sms_subscribers')
    .select('phone')
    .eq('artist_id', artist.id)
    .eq('status', 'active')

  // Carrier compliance: every campaign message must carry opt-out language.
  const body = `${text}\n\nReply STOP to opt out`

  let sent = 0
  for (const s of subs ?? []) {
    const ok = await sendSms(s.phone, body)
    if (ok) sent++
  }

  return NextResponse.json({ sent, total: (subs ?? []).length })
}
