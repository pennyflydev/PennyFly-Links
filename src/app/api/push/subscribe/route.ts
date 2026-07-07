import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Public: a fan subscribes to an artist's drop alerts.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { slug, subscription } = body as {
    slug?: string
    subscription?: { endpoint: string; keys: { p256dh: string; auth: string } }
  }

  if (!slug || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: artist } = await supabase.from('artists').select('id').eq('slug', slug).single()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  await supabase.from('push_subscriptions').upsert(
    {
      artist_id: artist.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: 'artist_id,endpoint' }
  )

  return NextResponse.json({ ok: true })
}
