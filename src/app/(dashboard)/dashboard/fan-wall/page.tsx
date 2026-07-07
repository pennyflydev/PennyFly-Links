import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { createAdminClient } from '@/lib/supabase/server'
import FanWallClient from './FanWallClient'

export default async function FanWallPage() {
  const artist = await getArtistForCurrentUser()

  if (!artist) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Fan Wall</h1>
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-5">
          <p className="text-yellow-400 text-sm font-medium">Your account is still being set up.</p>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()
  const { data: notes } = await supabase
    .from('fan_wall_notes')
    .select('id, name, message, is_pinned, created_at')
    .eq('artist_id', artist.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return <FanWallClient enabled={artist.fan_wall_enabled ?? false} notes={notes ?? []} artistSlug={artist.slug} />
}
