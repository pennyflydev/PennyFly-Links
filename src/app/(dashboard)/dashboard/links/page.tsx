import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getArtistForCurrentUser, getPromoLinksForArtist } from '@/lib/supabase/queries'
import LinksListClient, { type PromoLink } from './LinksListClient'
import NotifyFansButton from './NotifyFansButton'

export default async function LinksPage() {
  const artist = await getArtistForCurrentUser()
  const links = artist ? ((await getPromoLinksForArtist(artist.id)) as PromoLink[]) : []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My FlyLinks</h1>
        <div className="flex items-center gap-3">
          <NotifyFansButton />
          <Link href="/dashboard/links/create" className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
            <Plus className="w-4 h-4" />
            Create Link
          </Link>
        </div>
      </div>

      <LinksListClient initialLinks={links} artistSlug={artist?.slug ?? null} />
    </div>
  )
}
