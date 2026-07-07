import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'

function genCode() {
  return randomBytes(5).toString('hex') // 10 chars
}

export async function GET() {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  // Load or lazily create this account's referral code.
  const { data: row } = await supabase.from('profiles').select('referral_code').eq('id', profile.id).single()
  let code = row?.referral_code as string | null

  if (!code) {
    for (let i = 0; i < 5; i++) {
      const candidate = genCode()
      const { error } = await supabase.from('profiles').update({ referral_code: candidate }).eq('id', profile.id)
      if (!error) { code = candidate; break }
    }
  }

  const { count } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_profile_id', profile.id)

  return NextResponse.json({ code, count: count ?? 0 })
}
