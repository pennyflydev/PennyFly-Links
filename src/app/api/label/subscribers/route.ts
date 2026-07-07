import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForUser } from '@/lib/supabase/queries'

// Every fan across the label's whole roster (for CSV export / data ownership).
export async function GET() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'label') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const ctx = await getLabelForUser(profile.id)
  if (!ctx) return NextResponse.json({ error: 'Label not found' }, { status: 404 })
  const label = ctx.label

  const supabase = createAdminClient()
  const { data: artists } = await supabase.from('artists').select('id, artist_name').eq('label_id', label.id)
  const nameById = new Map((artists ?? []).map((a) => [a.id, a.artist_name as string]))
  const artistIds = (artists ?? []).map((a) => a.id)
  if (artistIds.length === 0) return NextResponse.json({ subscribers: [] })

  const { data: subs } = await supabase
    .from('subscribers')
    .select('email, name, source, country, created_at, artist_id')
    .in('artist_id', artistIds)
    .order('created_at', { ascending: false })

  const subscribers = (subs ?? []).map((s) => ({
    email: s.email,
    name: s.name,
    source: s.source,
    country: s.country,
    created_at: s.created_at,
    artist: nameById.get(s.artist_id) ?? '',
  }))

  return NextResponse.json({ subscribers })
}
