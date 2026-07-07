import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import EventsListClient, { type EventRow } from './EventsListClient'

export default async function EventsPage() {
  const artist = await getArtistForCurrentUser()

  let events: EventRow[] = []
  if (artist) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('events')
      .select('id, title, slug, start_at, venue, city, is_published')
      .eq('artist_id', artist.id)
      .order('start_at', { ascending: true })
    events = data ?? []
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-sm text-zinc-400 mt-1">Landing pages for shows, listening sessions, and launches</p>
        </div>
        <Link href="/dashboard/events/create" className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />Create Event
        </Link>
      </div>

      <EventsListClient initialEvents={events} />
    </div>
  )
}
