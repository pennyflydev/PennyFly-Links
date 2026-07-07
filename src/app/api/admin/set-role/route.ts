import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'

// Admin-only: change an account's role (admin <-> artist).
export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { profileId, role } = await req.json()
  if (!profileId || (role !== 'admin' && role !== 'artist')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Don't let an admin demote themselves and risk locking everyone out.
  if (profileId === profile.id && role !== 'admin') {
    return NextResponse.json({ error: 'You cannot change your own admin status' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role, onboarded: true })
    .eq('id', profileId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
