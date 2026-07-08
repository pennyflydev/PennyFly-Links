import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForUser } from '@/lib/supabase/queries'

async function managerCtx() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'label') return null
  const ctx = await getLabelForUser(profile.id)
  if (!ctx || (ctx.memberRole !== 'owner' && ctx.memberRole !== 'manager')) return null
  return ctx
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await managerCtx()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const allowed = ['title', 'message', 'url', 'cover_url', 'is_active']
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) updates[k] = body[k]

  const supabase = createAdminClient()
  const { error } = await supabase.from('label_campaigns').update(updates).eq('id', id).eq('label_id', ctx.label.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await managerCtx()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('label_campaigns').delete().eq('id', id).eq('label_id', ctx.label.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
