import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

// Toggle superfan (or other CRM fields) on a subscriber the artist owns.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const { id } = await params
  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if ('is_superfan' in body) updates.is_superfan = !!body.is_superfan

  const supabase = createAdminClient()
  const { error } = await supabase.from('subscribers').update(updates).eq('id', id).eq('artist_id', artist.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
