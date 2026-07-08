import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { refreshAccessToken, saveToLibrary, followReleaseArtist } from '@/lib/spotify'
import { getWebPush } from '@/lib/push'

// Runs daily (Vercel Cron). For pre-saves whose release date has arrived,
// uses each fan's stored authorization to add the drop to their library.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: rows } = await supabase
    .from('spotify_presave_authorizations')
    .select('id, refresh_token, target_type, target_id, presave_campaigns(release_date)')
    .eq('fulfilled', false)
    .limit(500)

  const due = (rows ?? []).filter((r) => {
    const rel = (r.presave_campaigns as unknown as { release_date: string } | null)?.release_date
    return rel && rel <= today
  })

  let fulfilled = 0
  let failed = 0

  for (const row of due) {
    const refreshed = await refreshAccessToken(row.refresh_token)
    if (!refreshed) {
      failed++
      continue
    }
    const ok = await saveToLibrary(refreshed.access_token, row.target_type as 'album' | 'track', row.target_id)
    if (ok) {
      await followReleaseArtist(refreshed.access_token, row.target_type as 'album' | 'track', row.target_id)
      await supabase.from('spotify_presave_authorizations').update({ fulfilled: true }).eq('id', row.id)
      fulfilled++
    } else {
      failed++
    }
  }

  // Release-day drop alerts: for campaigns now out that haven't announced yet,
  // push "out now" to the artist's subscribed fans and mark them notified.
  const webpush = getWebPush()
  let notified = 0
  if (webpush) {
    const { data: campaigns } = await supabase
      .from('presave_campaigns')
      .select('id, title, slug, artist_id, artists(artist_name, slug)')
      .eq('notified', false)
      .eq('is_active', true)
      .lte('release_date', today)
      .limit(200)

    for (const c of campaigns ?? []) {
      const artist = c.artists as unknown as { artist_name: string | null; slug: string | null } | null
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('artist_id', c.artist_id)

      const payload = JSON.stringify({
        title: `${c.title} is out now`,
        body: artist?.artist_name ? `New from ${artist.artist_name} — tap to listen` : 'Tap to listen',
        url: `/pre-save/${c.slug}`,
      })

      const dead: string[] = []
      await Promise.all(
        (subs ?? []).map(async (s) => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
          } catch (err) {
            const code = (err as { statusCode?: number }).statusCode
            if (code === 404 || code === 410) dead.push(s.id)
          }
        })
      )
      if (dead.length) await supabase.from('push_subscriptions').delete().in('id', dead)
      await supabase.from('presave_campaigns').update({ notified: true }).eq('id', c.id)
      notified++
    }
  }

  return NextResponse.json({ processed: due.length, fulfilled, failed, notified })
}
