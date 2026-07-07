import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'
import { getWebPush } from '@/lib/push'

// Artist broadcasts a drop alert to all their subscribed fans.
export async function POST(req: NextRequest) {
  const webpush = getWebPush()
  if (!webpush) return NextResponse.json({ error: 'Push not configured' }, { status: 503 })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { title, body, url } = await req.json()

  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('artist_id', artist.id)

  const payload = JSON.stringify({
    title: title || artist.artist_name || 'FlyLink',
    body: body || 'New drop — tap to listen',
    url: url || `/${artist.slug}`,
  })

  let sent = 0
  const dead: string[] = []
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        sent++
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) dead.push(s.id)
      }
    })
  )

  // Clean up expired subscriptions.
  if (dead.length) await supabase.from('push_subscriptions').delete().in('id', dead)

  return NextResponse.json({ sent, removed: dead.length })
}
