import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, getLabelForProfile } from '@/lib/supabase/queries'

async function ownerLabel() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'label') return null
  return getLabelForProfile(profile.id)
}

export async function GET() {
  const label = await ownerLabel()
  if (!label) return NextResponse.json({ error: 'Not a label' }, { status: 403 })
  return NextResponse.json({ label })
}

export async function PATCH(req: NextRequest) {
  const label = await ownerLabel()
  if (!label) return NextResponse.json({ error: 'Not a label' }, { status: 403 })

  const body = await req.json()
  const allowed = ['name', 'logo_url', 'accent_color']
  const updates: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) updates[k] = body[k]

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('labels').update(updates).eq('id', label.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ label: data })
}
