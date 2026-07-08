import { notFound } from 'next/navigation'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import TicketsManageClient, { type TicketType } from './TicketsManageClient'

export default async function EventTicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const artist = await getArtistForCurrentUser()
  if (!artist) notFound()

  const supabase = createAdminClient()
  const { data: event } = await supabase
    .from('events')
    .select('id, title, slug')
    .eq('id', id)
    .eq('artist_id', artist.id)
    .single()
  if (!event) notFound()

  const [{ data: types }, { count: checkedIn }] = await Promise.all([
    supabase.from('ticket_types').select('*').eq('event_id', id).order('sort_order', { ascending: true }),
    supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'used'),
  ])

  const ticketTypes = (types ?? []) as TicketType[]
  const totalSold = ticketTypes.reduce((n, t) => n + (t.sold ?? 0), 0)
  const revenueCents = ticketTypes.reduce((n, t) => n + (t.sold ?? 0) * (t.price_cents ?? 0), 0)

  return (
    <TicketsManageClient
      eventId={event.id}
      eventTitle={event.title}
      eventSlug={event.slug}
      initialTypes={ticketTypes}
      totalSold={totalSold}
      checkedIn={checkedIn ?? 0}
      revenueCents={revenueCents}
    />
  )
}
