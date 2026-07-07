import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

// Only a clear 404/410 counts as broken; blocked bots (403/429) are "unknown".
async function checkUrl(url: string): Promise<'ok' | 'broken' | 'unknown'> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal })
    }
    if (res.status === 404 || res.status === 410) return 'broken'
    if (res.status < 400) return 'ok'
    return 'unknown'
  } catch {
    return 'unknown'
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const supabase = createAdminClient()
  const { data: links } = await supabase
    .from('promo_links')
    .select('id, title, streaming_links(platform, url)')
    .eq('artist_id', artist.id)

  const results = await Promise.all(
    (links ?? []).map(async (l) => {
      const sls = (l.streaming_links as { platform: string; url: string }[]) ?? []
      const checks = await Promise.all(sls.map(async (sl) => ({ platform: sl.platform, status: await checkUrl(sl.url) })))
      const broken = checks.filter((c) => c.status === 'broken').map((c) => c.platform)
      return { id: l.id as string, title: l.title as string, broken }
    })
  )

  return NextResponse.json({ issues: results.filter((r) => r.broken.length > 0) })
}
