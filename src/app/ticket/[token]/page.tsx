import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { buildGoogleWalletTicketUrl } from '@/lib/wallet/google'
import TicketView from './TicketView'

export const dynamic = 'force-dynamic'

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data: ticket } = await supabase
    .from('tickets')
    .select('token, buyer_name, status, checked_in_at, events(title, start_at, venue, city), ticket_types(name)')
    .eq('token', token)
    .single()

  if (!ticket) notFound()

  const event = ticket.events as unknown as { title: string; start_at: string; venue: string | null; city: string | null } | null
  const type = ticket.ticket_types as unknown as { name: string } | null

  // "Add to Google Wallet" link (null unless Google Wallet is configured and the
  // ticket is still valid). Barcode = token, so it scans like the web ticket.
  const walletUrl =
    ticket.status === 'valid' && event
      ? buildGoogleWalletTicketUrl({
          ticketId: ticket.token, // token is unique; fine as the object suffix
          token: ticket.token,
          eventTitle: event.title,
          dateStr: event.start_at
            ? new Date(event.start_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : '',
          venue: [event.venue, event.city].filter(Boolean).join(', ') || null,
          ticketType: type?.name ?? 'Ticket',
          buyerName: ticket.buyer_name,
        })
      : null

  return (
    <TicketView
      token={ticket.token}
      buyerName={ticket.buyer_name}
      status={ticket.status}
      checkedInAt={ticket.checked_in_at}
      eventTitle={event?.title ?? 'Event'}
      startAt={event?.start_at ?? null}
      venue={event?.venue ?? null}
      city={event?.city ?? null}
      ticketType={type?.name ?? 'Ticket'}
      walletUrl={walletUrl}
    />
  )
}
