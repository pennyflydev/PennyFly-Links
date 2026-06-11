import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { artistId, eventType, promoLinkId, platform } = body

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
  })

  // Increment click counter on the streaming_link if applicable
  if (eventType === 'click' && promoLinkId && platform) {
    await supabase.rpc('increment_click', { link_id: promoLinkId })
  }

  return NextResponse.json({ ok: true })
}
