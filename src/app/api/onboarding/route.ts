import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admins never go through onboarding.
  if (profile.role === 'admin') return NextResponse.json({ ok: true, redirect: '/roster' })

  const { type, labelName } = await req.json()
  const supabase = createAdminClient()

  if (type === 'label') {
    // Promote to a label account: create the label, drop the auto-created artist page.
    const { error: labelErr } = await supabase
      .from('labels')
      .insert({ owner_profile_id: profile.id, name: (labelName || '').trim() })
    if (labelErr) return NextResponse.json({ error: labelErr.message }, { status: 500 })

    await supabase.from('artists').delete().eq('profile_id', profile.id)
    await supabase.from('profiles').update({ role: 'label', plan: 'label', onboarded: true }).eq('id', profile.id)

    return NextResponse.json({ ok: true, redirect: '/label' })
  }

  // Default: stay an artist.
  await supabase.from('profiles').update({ onboarded: true }).eq('id', profile.id)
  return NextResponse.json({ ok: true, redirect: '/dashboard/overview' })
}
