import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ tiers: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('artist_id', artist.id)
    .order('sort_order', { ascending: true })
    .order('price_cents', { ascending: true })

  return NextResponse.json({ tiers: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { name, priceCents, interval, description, perks, buyUrl } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('membership_tiers')
    .insert({
      artist_id: artist.id,
      name,
      price_cents: Math.max(0, Math.round(priceCents ?? 0)),
      interval: interval === 'year' ? 'year' : 'month',
      description: description ?? '',
      perks: Array.isArray(perks) ? perks.filter((p: string) => p?.trim()).map((p: string) => p.trim()) : [],
      join_url: buyUrl || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tier: data }, { status: 201 })
}
