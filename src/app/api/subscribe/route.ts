import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Public endpoint — fans submit their email on a pre-save page.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { slug, email, name } = body as { slug?: string; email?: string; name?: string }

  if (!slug || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: campaign } = await supabase
    .from('presave_campaigns')
    .select('id, artist_id, save_count')
    .eq('slug', slug)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const { error } = await supabase.from('subscribers').insert({
    artist_id: campaign.artist_id,
    email: email.toLowerCase().trim(),
    name: name?.trim() || null,
    source: 'presave',
    source_id: campaign.id,
  })

  if (error) {
    // 23505 = unique violation: this fan already pre-saved. Treat as success.
    if (error.code === '23505') return NextResponse.json({ ok: true, alreadySaved: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Bump the fan counter (best-effort, non-atomic — fine at this scale).
  await supabase
    .from('presave_campaigns')
    .update({ save_count: campaign.save_count + 1 })
    .eq('id', campaign.id)

  return NextResponse.json({ ok: true })
}
