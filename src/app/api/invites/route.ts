import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForUser } from '@/lib/supabase/queries'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Admins and labels can invite. Returns { profileId, labelId } or null.
async function inviterContext() {
  const profile = await getCurrentProfile()
  if (!profile) return null
  if (profile.role === 'admin') return { profileId: profile.id, labelId: null as string | null }
  if (profile.role === 'label') {
    const ctx = await getLabelForUser(profile.id)
    if (!ctx || (ctx.memberRole !== 'owner' && ctx.memberRole !== 'manager')) return null
    return { profileId: profile.id, labelId: ctx.label.id }
  }
  return null
}

export async function GET() {
  const ctx = await inviterContext()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  let q = supabase
    .from('artist_invites')
    .select('id, email, token, claimed_at, expires_at, created_at')
    .order('created_at', { ascending: false })
  // Labels see only their own invites; admin sees all.
  if (ctx.labelId) q = q.eq('label_id', ctx.labelId)
  const { data } = await q
  return NextResponse.json({ invites: data ?? [] })
}

export async function POST(req: NextRequest) {
  const ctx = await inviterContext()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email } = await req.json()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('artist_invites')
    .insert({ email: email.toLowerCase().trim(), invited_by: ctx.profileId, label_id: ctx.labelId })
    .select('id, email, token, claimed_at, expires_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invite: data }, { status: 201 })
}
