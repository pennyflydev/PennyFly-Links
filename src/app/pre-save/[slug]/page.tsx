import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchStreamingLinks } from '@/lib/odesli'
import PresaveClient from './PresaveClient'
import PixelScripts from '@/components/PixelScripts'

type SmartLink = { platform: string; url: string }

// Once a release is out, the pre-save link flips to a full multi-platform
// streaming link. Resolve the DSP links from Odesli and cache them on the
// campaign so we don't hit Odesli on every page load.
async function resolveSmartLinks(campaign: {
  id: string
  spotify_url: string | null
  smart_links: SmartLink[] | null
}): Promise<SmartLink[]> {
  if (campaign.smart_links && campaign.smart_links.length > 0) return campaign.smart_links
  if (!campaign.spotify_url) return []

  const result = await fetchStreamingLinks(campaign.spotify_url)
  const links = result?.links ?? []
  if (links.length > 0) {
    const supabase = createAdminClient()
    await supabase.from('presave_campaigns').update({ smart_links: links }).eq('id', campaign.id)
  }
  return links
}

async function getCampaign(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('presave_campaigns')
    .select('*, artists(artist_name, avatar_url, slug, meta_pixel_id, tiktok_pixel_id, ga_measurement_id)')
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

export default async function PresavePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ connected?: string }>
}) {
  const { slug } = await params
  const { connected } = await searchParams
  const campaign = await getCampaign(slug)
  if (!campaign) notFound()

  // Flip to streaming links the moment the release date has passed.
  const isReleased = new Date(campaign.release_date).getTime() <= Date.now()
  const smartLinks = isReleased ? await resolveSmartLinks(campaign) : []

  return (
    <>
      <PixelScripts
        metaPixelId={campaign.artists?.meta_pixel_id}
        tiktokPixelId={campaign.artists?.tiktok_pixel_id}
        gaMeasurementId={campaign.artists?.ga_measurement_id}
      />
      <PresaveClient
        campaignId={campaign.id}
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
        connected={connected === '1'}
        smartLinks={smartLinks}
      />
    </>
  )
}
