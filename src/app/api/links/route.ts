import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { slugify } from '@/lib/utils'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ links: [] })

  const supabase = await createClient()
  const { data } = await supabase
    .from('promo_links')
    .select('*, streaming_links(*)')
    .eq('artist_id', artist.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ links: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const { title, artistName, subtitle, releaseType, slug, coverUrl, streamingLinks, publish } = body

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const finalSlug = slug || slugify(title)
  const supabase = createAdminClient()

  const { data: link, error } = await supabase
    .from('promo_links')
    .insert({
      artist_id: artist.id,
      title,
      slug: finalSlug,
      artist_name: artistName ?? artist.artist_name,
      subtitle: subtitle ?? '',
      release_type: releaseType ?? 'single',
      cover_url: coverUrl ?? null,
      is_published: publish ?? false,
    })
    .select()
    .single()

  if (error || !link) {
    console.error('Link insert failed:', error)
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  if (streamingLinks?.length) {
    await supabase.from('streaming_links').insert(
      streamingLinks.map((sl: { platform: string; url: string }, i: number) => ({
        promo_link_id: link.id,
        platform: sl.platform,
        url: sl.url,
        sort_order: i,
      }))
    )
  }

  return NextResponse.json({ link }, { status: 201 })
}
