import { auth } from '@clerk/nextjs/server'
import { createClient } from './server'

export async function getArtistForCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select('*, profiles!inner(clerk_id, role, plan)')
    .eq('profiles.clerk_id', userId)
    .single()

  return data
}

export async function getPromoLinksForArtist(artistId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('promo_links')
    .select('*, streaming_links(*)')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getArtistBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('artists')
    .select(`
      *,
      social_links(*),
      custom_links(*),
      artist_page_sections(*)
    `)
    .eq('slug', slug)
    .single()

  return data
}

export async function getPublishedLinksForArtist(artistId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('promo_links')
    .select('*, streaming_links(*)')
    .eq('artist_id', artistId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getActivePresavesForArtist(artistId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('presave_campaigns')
    .select('*')
    .eq('artist_id', artistId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getAnalyticsSummary(artistId: string) {
  const supabase = await createClient()

  const [views, clicks, links] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('artist_id', artistId)
      .eq('event_type', 'view'),
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('artist_id', artistId)
      .eq('event_type', 'click'),
    supabase
      .from('promo_links')
      .select('id', { count: 'exact', head: true })
      .eq('artist_id', artistId)
      .eq('is_published', true),
  ])

  const totalViews = views.count ?? 0
  const totalClicks = clicks.count ?? 0
  const activeLinks = links.count ?? 0
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0'

  return { totalViews, totalClicks, activeLinks, ctr }
}
