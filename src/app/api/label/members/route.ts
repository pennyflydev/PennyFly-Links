import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForUser } from '@/lib/supabase/queries'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Owners and managers can manage the team.
async function managerContext() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'label') return null
  const ctx = await getLabelForUser(profile.id)
  if (!ctx || (ctx.memberRole !== 'owner' && ctx.memberRole !== 'manager')) return null
  return { profile, ...ctx }
}

export async function GET() {
  const ctx = await managerContext()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.from('label_members').select('id, member_role, created_at, profiles(email)').eq('label_id', ctx.label.id),
    supabase.from('label_member_invites').select('id, email, member_role, claimed_at:claimed_by, created_at').eq('label_id', ctx.label.id),
  ])

  return NextResponse.json({
    members: members ?? [],
    invites: (invites ?? []).filter((i) => !i.claimed_at),
  })
}

export async function POST(req: NextRequest) {
  const ctx = await managerContext()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, role } = await req.json()
  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  const memberRole = role === 'viewer' ? 'viewer' : 'manager'

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('label_member_invites')
    .insert({ label_id: ctx.label.id, email: email.toLowerCase().trim(), member_role: memberRole })
    .select('id, email, member_role, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invite: data }, { status: 201 })
}
