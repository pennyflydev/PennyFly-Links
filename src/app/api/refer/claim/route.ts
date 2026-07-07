import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'

// Called once after signup. If a referral cookie is present, attribute it.
export async function POST(req: NextRequest) {
  const code = req.cookies.get('flylink_ref')?.value

  const clear = (payload: object) => {
    const res = NextResponse.json(payload)
    res.cookies.delete('flylink_ref')
    return res
  }

  if (!code) return NextResponse.json({ ok: true })

  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ ok: true })

  const supabase = createAdminClient()

  // Find the referrer by code.
  const { data: referrer } = await supabase.from('profiles').select('id, email').eq('referral_code', code).single()
  if (!referrer || referrer.id === profile.id) return clear({ ok: true })

  const { data: me } = await supabase.from('profiles').select('email').eq('id', profile.id).single()

  // Idempotent — unique on referred_profile_id.
  await supabase.from('referrals').insert({
    referrer_profile_id: referrer.id,
    referred_profile_id: profile.id,
    referred_email: me?.email ?? null,
  })

  return clear({ ok: true })
}
