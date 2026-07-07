import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForProfile } from '@/lib/supabase/queries'
import { getWebPush } from '@/lib/push'

// A label broadcasts a push to every fan across its whole roster.
export async function POST(req: NextRequest) {
  const webpush = getWebPush()
  if (!webpush) return NextResponse.json({ error: 'Push not configured' }, { status: 503 })

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'label') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const label = await getLabelForProfile(profile.id)
  if (!label) return NextResponse.json({ error: 'Label not found' }, { status: 404 })

  const { body, url } = await req.json()

  const supabase = createAdminClient()
  const { data: artists } = await supabase.from('artists').select('id').eq('label_id', label.id)
  const artistIds = (artists ?? []).map((a) => a.id)
  if (artistIds.length === 0) return NextResponse.json({ sent: 0 })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('artist_id', artistIds)

  const payload = JSON.stringify({
    title: label.name || 'FlyLink',
    body: body || 'New from the label',
    url: url || '/',
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

  if (dead.length) await supabase.from('push_subscriptions').delete().in('id', dead)

  return NextResponse.json({ sent, removed: dead.length })
}
