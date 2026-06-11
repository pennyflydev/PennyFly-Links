import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import PresaveClient from './PresaveClient'

async function getCampaign(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('presave_campaigns')
    .select('*, artists(artist_name, avatar_url, slug)')
    .eq('slug', slug)
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const campaign = await getCampaign(slug)
  if (!campaign) return { title: 'Not Found' }
  const artistName = campaign.artists?.artist_name ?? ''
  return {
    title: `Pre-save ${campaign.title}${artistName ? ` — ${artistName}` : ''} | FlyLink`,
    description: campaign.description || `Pre-save ${campaign.title} and be the first to hear it on release day.`,
    openGraph: { images: campaign.cover_url ? [campaign.cover_url] : [] },
  }
}

export default async function PresavePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const campaign = await getCampaign(slug)
  if (!campaign) notFound()

  return (
    <PresaveClient
      slug={campaign.slug}
      title={campaign.title}
      artistName={campaign.artists?.artist_name ?? ''}
      artistSlug={campaign.artists?.slug ?? null}
      coverUrl={campaign.cover_url}
      releaseDate={campaign.release_date}
      description={campaign.description}
      spotifyUrl={campaign.spotify_url}
      showFanCount={campaign.show_fan_count}
      saveCount={campaign.save_count}
      isActive={campaign.is_active}
    />
  )
}
