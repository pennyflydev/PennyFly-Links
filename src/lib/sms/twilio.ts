import { createHmac } from 'crypto'

// Twilio SMS helpers. Everything is inert (no-op / false) until the Twilio
// env vars are set, so the SMS features degrade gracefully when unconfigured.
//
// Env:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM            – a Twilio number (+1...) OR a Messaging Service SID (MG...)

export function isTwilioConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM)
}

// Best-effort E.164 normalization. Defaults bare 10-digit numbers to US (+1).
// Returns null if it can't produce something plausible.
export function normalizePhone(input: string): string | null {
  const trimmed = (input || '').trim()
  if (!trimmed) return null
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '')
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
}

// Send one SMS. Returns true on success, false if unconfigured or on error.
export async function sendSms(to: string, body: string): Promise<boolean> {
  if (!isTwilioConfigured()) return false
  const sid = process.env.TWILIO_ACCOUNT_SID as string
  const token = process.env.TWILIO_AUTH_TOKEN as string
  const from = process.env.TWILIO_FROM as string

  const params = new URLSearchParams()
  params.set('To', to)
  params.set('Body', body)
  // A Messaging Service SID uses MessagingServiceSid; a number uses From.
  if (from.startsWith('MG')) params.set('MessagingServiceSid', from)
  else params.set('From', from)

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    return res.ok
  } catch {
    return false
  }
}

// Validate an inbound Twilio webhook signature (X-Twilio-Signature).
// Algorithm: base64(HMAC-SHA1(authToken, url + sorted(key+value) params)).
export function validateTwilioSignature(url: string, params: Record<string, string>, signature: string | null): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!token || !signature) return false
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url)
  const expected = createHmac('sha1', token).update(Buffer.from(data, 'utf-8')).digest('base64')
  return expected === signature
}

// Carrier-standard opt-out / help keywords.
export const STOP_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit']
export const START_KEYWORDS = ['start', 'unstop', 'yes']
export const HELP_KEYWORDS = ['help', 'info']
