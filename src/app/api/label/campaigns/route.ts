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

export async function GET() {
  const ctx = await managerCtx()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('label_campaigns')
    .select('*')
    .eq('label_id', ctx.label.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ campaigns: data ?? [] })
}

export async function POST(req: NextRequest) {
  const ctx = await managerCtx()
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, message, url, coverUrl } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('label_campaigns')
    .insert({ label_id: ctx.label.id, title, message: message ?? '', url: url || null, cover_url: coverUrl ?? null, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data }, { status: 201 })
}
