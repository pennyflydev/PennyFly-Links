// Transactional email via Resend's HTTP API. Everything is inert (no-op /
// false) until the env vars are set, so email features degrade gracefully when
// unconfigured — the on-screen ticket redirect still works without email.
//
// Env:
//   RESEND_API_KEY  – Resend API key (re_...)
//   EMAIL_FROM      – verified sender, e.g. "FlyLink <tickets@yourdomain.com>"
//                     (for quick testing you can use "onboarding@resend.dev")

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

// Send one email. Returns true on success, false if unconfigured or on error.
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<boolean> {
  if (!isEmailConfigured()) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_PROD_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://penny-fly-links.vercel.app'
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

// Send a buyer their ticket link after a free claim or a paid purchase.
// Pure: the caller supplies the display fields + token; we build the URL and
// markup here. Returns false (and sends nothing) when email isn't configured
// or when there's no buyer email to send to.
export async function sendTicketEmail(ticket: {
  token: string
  buyerName: string | null
  buyerEmail: string | null
  eventTitle: string
  startAt: string | null
  venue: string | null
  city: string | null
  ticketType: string
}): Promise<boolean> {
  if (!isEmailConfigured()) return false
  const to = ticket.buyerEmail?.trim()
  if (!to) return false

  const url = `${siteOrigin()}/ticket/${ticket.token}`
  const when = ticket.startAt
    ? new Date(ticket.startAt).toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null
  const where = [ticket.venue, ticket.city].filter(Boolean).join(', ') || null

  const greetingName = ticket.buyerName?.trim() ? escapeHtml(ticket.buyerName.trim()) : 'there'
  const eventTitle = escapeHtml(ticket.eventTitle)
  const ticketType = escapeHtml(ticket.ticketType)

  const detailRow = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#888;font-size:14px;">${label}</td><td style="padding:4px 0;color:#fff;font-size:14px;font-weight:600;">${value}</td></tr>`

  const html = `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#141414;border:1px solid #262626;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;">
          <p style="margin:0 0 4px;color:#a3a3a3;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Your ticket</p>
          <h1 style="margin:0;color:#fff;font-size:24px;line-height:1.2;">${eventTitle}</h1>
        </td></tr>
        <tr><td style="padding:16px 32px 8px;">
          <p style="margin:0 0 16px;color:#d4d4d4;font-size:15px;line-height:1.5;">Hi ${greetingName}, you're in. Here's your ticket — show the QR code at the door.</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            ${detailRow('Ticket', ticketType)}
            ${when ? detailRow('When', escapeHtml(when)) : ''}
            ${where ? detailRow('Where', escapeHtml(where)) : ''}
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px;">
          <a href="${url}" style="display:block;background:#fff;color:#000;text-align:center;text-decoration:none;font-weight:600;font-size:15px;padding:14px 20px;border-radius:12px;">View your ticket &amp; QR code</a>
          <p style="margin:16px 0 0;color:#737373;font-size:12px;line-height:1.5;text-align:center;">Or paste this link into your browser:<br><a href="${url}" style="color:#a3a3a3;">${url}</a></p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;color:#525252;font-size:12px;">Powered by FlyLink</p>
    </td></tr>
  </table>
</body></html>`

  const textLines = [
    `Your ticket — ${ticket.eventTitle}`,
    '',
    `Hi ${ticket.buyerName?.trim() || 'there'}, you're in. Show the QR code at the door.`,
    '',
    `Ticket: ${ticket.ticketType}`,
    ...(when ? [`When: ${when}`] : []),
    ...(where ? [`Where: ${where}`] : []),
    '',
    `View your ticket & QR code:`,
    url,
    '',
    'Powered by FlyLink',
  ]

  return sendEmail({
    to,
    subject: `Your ticket for ${ticket.eventTitle}`,
    html,
    text: textLines.join('\n'),
  })
}
