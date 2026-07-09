import { cache } from 'react'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createClient } from './server'
import { createAdminClient } from './server'
import { isLinkLive } from '@/lib/utils'
import { limitsForPlan } from '@/lib/stripe'

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

// The label a profile owns OR is a team member of, plus their role.
export async function getLabelForUser(profileId: string) {
  const supabase = createAdminClient()
  const owned = await supabase.from('labels').select('*').eq('owner_profile_id', profileId).single()
  if (owned.data) return { label: owned.data, memberRole: 'owner' as const }

  const mem = await supabase.from('label_members').select('member_role, labels(*)').eq('profile_id', profileId).single()
  if (mem.data?.labels) {
    return { label: mem.data.labels as unknown as { id: string; name: string; logo_url: string | null; accent_color: string | null }, memberRole: mem.data.member_role as string }
  }
  return null
}

// Artist-seat usage for a label: how many roster seats are taken (current
// artists + pending, unexpired invites) and the plan's seat limit. A seat is
// "used" the moment an invite is sent, so a label can't over-invite past its cap.
export async function getLabelSeatInfo(labelId: string): Promise<{ used: number; limit: number }> {
  const supabase = createAdminClient()
  const { data: lbl } = await supabase.from('labels').select('owner_profile_id').eq('id', labelId).maybeSingle()
  let plan = 'label'
  if (lbl?.owner_profile_id) {
    const { data: owner } = await supabase.from('profiles').select('plan').eq('id', lbl.owner_profile_id).maybeSingle()
    if (owner?.plan) plan = owner.plan
  }
  const limit = limitsForPlan(plan).artistSeats
  const [{ count: artists }, { count: invites }] = await Promise.all([
    supabase.from('artists').select('id', { count: 'exact', head: true }).eq('label_id', labelId),
    supabase
      .from('artist_invites')
      .select('id', { count: 'exact', head: true })
      .eq('label_id', labelId)
      .is('claimed_at', null)
      .gt('expires_at', new Date().toISOString()),
  ])
  return { used: (artists ?? 0) + (invites ?? 0), limit }
}

// Can this profile view/manage the given artist? Admins can manage anyone;
// a label can manage artists on its roster.
export async function canManageArtist(
  profile: NonNullable<CurrentProfile>,
  artist: { label_id?: string | null }
): Promise<boolean> {
  if (profile.role === 'admin') return true
  if (profile.role === 'label' && artist.label_id) {
    const ctx = await getLabelForUser(profile.id)
    return !!ctx && ctx.label.id === artist.label_id
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
      products(*),
      membership_tiers(*)
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
