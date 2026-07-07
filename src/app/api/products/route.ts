import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ products: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('artist_id', artist.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return NextResponse.json({ products: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const { title, description, priceCents, coverUrl, buyUrl, publish } = body
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      artist_id: artist.id,
      title,
      description: description ?? '',
      price_cents: Math.max(0, Math.round(priceCents ?? 0)),
      cover_url: coverUrl ?? null,
      buy_url: buyUrl || null,
      is_published: publish ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product }, { status: 201 })
}
