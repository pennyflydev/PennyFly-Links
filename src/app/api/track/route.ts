import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { artistId, eventType, promoLinkId, platform } = body as {
    artistId?: string
    eventType?: 'view' | 'click'
    promoLinkId?: string
    platform?: string
  }

  if (!artistId || !eventType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createAdminClient()
  await supabase.from('analytics_events').insert({
    artist_id: artistId,
    event_type: eventType,
    promo_link_id: promoLinkId ?? null,
    platform: platform ?? null,
    referrer: req.headers.get('referer') ?? null,
    country: req.headers.get('x-vercel-ip-country') ?? null,
  })

  // Keep the per-link counter on promo_links in sync (read-modify-write; fine at this scale).
  if (promoLinkId) {
    const col = eventType === 'click' ? 'click_count' : 'view_count'
    const { data: link } = await supabase.from('promo_links').select(col).eq('id', promoLinkId).single()
    if (link) {
      const current = (link as Record<string, number>)[col] ?? 0
      await supabase.from('promo_links').update({ [col]: current + 1 }).eq('id', promoLinkId)
    }
  }

  return NextResponse.json({ ok: true })
}
