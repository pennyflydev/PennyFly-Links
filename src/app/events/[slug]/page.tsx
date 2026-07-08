import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import PixelScripts from '@/components/PixelScripts'
import EventClient from './EventClient'

async function getEvent(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('events')
    .select('*, artists(artist_name, slug, meta_pixel_id, tiktok_pixel_id, ga_measurement_id, stripe_charges_enabled)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data
}

async function getTicketTypes(eventId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('ticket_types')
    .select('id, name, price_cents, quantity, sold')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  return data ?? []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: 'Not Found' }
  const artistName = event.artists?.artist_name ?? ''
  return {
    title: `${event.title}${artistName ? ` — ${artistName}` : ''} | FlyLink`,
    description: event.description || `${event.title} — get tickets and details.`,
    openGraph: { images: event.cover_url ? [event.cover_url] : [] },
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const ticketTypes = await getTicketTypes(event.id)

  return (
    <>
      <PixelScripts
        metaPixelId={event.artists?.meta_pixel_id}
        tiktokPixelId={event.artists?.tiktok_pixel_id}
        gaMeasurementId={event.artists?.ga_measurement_id}
      />
      <EventClient
        title={event.title}
        artistName={event.artists?.artist_name ?? ''}
        artistSlug={event.artists?.slug ?? null}
        description={event.description}
        coverUrl={event.cover_url}
        startAt={event.start_at}
        venue={event.venue}
        city={event.city}
        ticketUrl={event.ticket_url}
        ticketTypes={ticketTypes}
        chargesEnabled={!!event.artists?.stripe_charges_enabled}
      />
    </>
  )
}
