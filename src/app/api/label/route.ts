import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForUser } from '@/lib/supabase/queries'

async function labelCtx() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'label') return null
  return getLabelForUser(profile.id)
}

export async function GET() {
  const ctx = await labelCtx()
  if (!ctx) return NextResponse.json({ error: 'Not a label' }, { status: 403 })
  return NextResponse.json({ label: ctx.label })
}

export async function PATCH(req: NextRequest) {
  const ctx = await labelCtx()
  if (!ctx || (ctx.memberRole !== 'owner' && ctx.memberRole !== 'manager')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const label = ctx.label

  const body = await req.json()
  const allowed = ['name', 'logo_url', 'accent_color']
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) updates[k] = body[k]

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('labels').update(updates).eq('id', label.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ label: data })
}
