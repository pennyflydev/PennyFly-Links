import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ items: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('exclusive_content')
    .select('*')
    .eq('artist_id', artist.id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { title, description, rewardUrl, coverUrl, priceCents } = await req.json()
  if (!title || !rewardUrl) return NextResponse.json({ error: 'Title and reward link required' }, { status: 400 })

  const price = Math.max(0, Math.round(Number(priceCents) || 0))

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('exclusive_content')
    .insert({ artist_id: artist.id, title, description: description ?? '', reward_url: rewardUrl, cover_url: coverUrl ?? null, price_cents: price, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}
