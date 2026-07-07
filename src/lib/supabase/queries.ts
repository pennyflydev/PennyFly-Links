import { cache } from 'react'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createClient } from './server'
import { createAdminClient } from './server'
import { isLinkLive } from '@/lib/utils'

export const IMPERSONATE_COOKIE = 'impersonate_artist_id'

export type CurrentProfile = { id: string; role: string; clerk_id: string; onboarded: boolean } | null

// Resolve the logged-in user's profile (the real account, never impersonated).
// Wrapped in cache() so the 3+ callers in one request share a single query.
export const getCurrentProfile = cache(async (): Promise<CurrentProfile> => {
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createAdminClient()
  // select('*') so we don't hard-depend on columns from later migrations
  // (e.g. `onboarded`); missing ones simply come back undefined.
  const { data } = await supabase.from('profiles').select('*').eq('clerk_id', userId).single()
  if (!data) return null
  return { id: data.id, role: data.role, clerk_id: data.clerk_id, onboarded: data.onboarded ?? true }
})

// Label account owned by this profile (if any).
export async function getLabelForProfile(profileId: string) {
  const supabase = createAdminClient()
  const { data } = await supabase.from('labels').select('*').eq('owner_profile_id', profileId).single()
  return data
}

// Can this profile view/manage the given artist? Admins can manage anyone;
// a label can manage artists on its roster.
export async function canManageArtist(
  profile: NonNullable<CurrentProfile>,
  artist: { label_id?: string | null }
): Promise<boolean> {
  if (profile.role === 'admin') return true
  if (profile.role === 'label' && artist.label_id) {
    const label = await getLabelForProfile(profile.id)
    return !!label && label.id === artist.label_id
  }
  return false
}

// The artist whose dashboard the current request acts on.
// Honors an impersonation cookie when the caller is authorized to use it.
// Cached per-request so layout + page don't each re-run it.
export const getArtistForCurrentUser = cache(async () => {
  const profile = await getCurrentProfile()
  if (!profile) return null

  const supabase = createAdminClient()

  const cookieStore = await cookies()
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value
  if (impersonateId) {
    const { data: target } = await supabase
      .from('artists')
      .select('*, profiles(clerk_id, role, plan)')
      .eq('id', impersonateId)
      .single()
    if (target && (await canManageArtist(profile, target))) return target
  }

  const { data } = await supabase
    .from('artists')
    .select('*, profiles(clerk_id, role, plan)')
    .eq('profile_id', profile.id)
    .single()

  return data
})

// Banner context: is the current request impersonating, and as whom?
export async function getImpersonationContext() {
  const cookieStore = await cookies()
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value
  if (!impersonateId) return null

  const profile = await getCurrentProfile()
  if (!profile) return null

  const supabase = createAdminClient()
  const { data: target } = await supabase
    .from('artists')
    .select('id, artist_name, slug, label_id')
    .eq('id', impersonateId)
    .single()
  if (!target || !(await canManageArtist(profile, target))) return null

  return { artistId: target.id, artistName: target.artist_name || target.slug }
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
      profiles(plan),
      labels(name, logo_url),
      social_links(*),
      custom_links(*),
      artist_page_sections(*),
      playlist_spotlights(*),
      fan_wall_notes(*),
      media_embeds(*),
      products(*)
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

  // Respect the schedule window (publish_at / expires_at).
  return (data ?? []).filter((l) => isLinkLive(l))
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
