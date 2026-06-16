import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { refreshAccessToken, saveToLibrary, followReleaseArtist } from '@/lib/spotify'

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

  return NextResponse.json({ processed: due.length, fulfilled, failed })
}
