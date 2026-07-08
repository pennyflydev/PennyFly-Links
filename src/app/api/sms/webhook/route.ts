import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateTwilioSignature, STOP_KEYWORDS, START_KEYWORDS, HELP_KEYWORDS } from '@/lib/sms/twilio'

// Twilio posts inbound texts here. We honor STOP/START/HELP for compliance.
// Configure this URL as the messaging webhook in the Twilio console.
function twiml(message?: string): Response {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
  return new Response(body, { headers: { 'Content-Type': 'text/xml' } })
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const params: Record<string, string> = {}
  form.forEach((v, k) => (params[k] = String(v)))

  // Verify the request really came from Twilio (best-effort; skips if no token).
  const url = `${process.env.NEXT_PUBLIC_PROD_URL || ''}/api/sms/webhook`
  const signature = req.headers.get('x-twilio-signature')
  if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(url, params, signature)) {
    return new Response('Invalid signature', { status: 403 })
  }

  const from = params.From
  const text = (params.Body ?? '').trim().toLowerCase()
  if (!from) return twiml()

  const supabase = createAdminClient()

  if (STOP_KEYWORDS.includes(text)) {
    // Unsubscribe this number from every artist it follows.
    await supabase.from('sms_subscribers').update({ status: 'unsubscribed' }).eq('phone', from)
    return twiml('You have been unsubscribed and will no longer receive messages. Reply START to opt back in.')
  }

  if (START_KEYWORDS.includes(text)) {
    await supabase.from('sms_subscribers').update({ status: 'active' }).eq('phone', from)
    return twiml("You're opted back in to drop alerts. Reply STOP to opt out.")
  }

  if (HELP_KEYWORDS.includes(text)) {
    return twiml('FlyLink drop alerts. Msg&data rates may apply. Reply STOP to opt out.')
  }

  return twiml()
}
