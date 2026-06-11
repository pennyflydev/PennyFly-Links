import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function requireAdminProfile() {
  const { userId } = await auth()
  if (!userId || userId !== process.env.ADMIN_CLERK_USER_ID) return null
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('id').eq('clerk_id', userId).single()
  return data?.id ?? null
}

export async function GET() {
  const profileId = await requireAdminProfile()
  if (!profileId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('artist_invites')
    .select('id, email, token, claimed_at, expires_at, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ invites: data ?? [] })
}

export async function POST(req: NextRequest) {
  const profileId = await requireAdminProfile()
  if (!profileId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email } = await req.json()
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('artist_invites')
    .insert({ email: email.toLowerCase().trim(), invited_by: profileId })
    .select('id, email, token, claimed_at, expires_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invite: data }, { status: 201 })
}
