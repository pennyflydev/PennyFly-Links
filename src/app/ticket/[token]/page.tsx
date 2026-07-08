import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
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
    />
  )
}
