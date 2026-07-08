import { notFound } from 'next/navigation'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import ScannerClient from './ScannerClient'

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const artist = await getArtistForCurrentUser()
  if (!artist) notFound()

  const supabase = createAdminClient()
  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', id)
    .eq('artist_id', artist.id)
    .single()
  if (!event) notFound()

  return <ScannerClient eventId={event.id} eventTitle={event.title} />
}
