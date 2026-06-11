import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, canManageArtist, IMPERSONATE_COOKIE } from '@/lib/supabase/queries'

// Start impersonating an artist (admin or owning label only).
export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { artistId } = await req.json()
  if (!artistId) return NextResponse.json({ error: 'artistId required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: artist } = await supabase.from('artists').select('id, label_id').eq('id', artistId).single()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  if (!(await canManageArtist(profile, artist))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(IMPERSONATE_COOKIE, artistId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours
  })
  return res
}

// Stop impersonating.
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(IMPERSONATE_COOKIE)
  return res
}
