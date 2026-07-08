import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/queries'

// Fan follows / unfollows an artist. Any signed-in account can follow, but
// this is the core action of a fan (role='fan') account.
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 404 })

  const { artistId, follow } = await req.json()
  if (!artistId) return NextResponse.json({ error: 'artistId required' }, { status: 400 })

  const supabase = createAdminClient()

  if (follow === false) {
    await supabase.from('fan_follows').delete().eq('fan_profile_id', profile.id).eq('artist_id', artistId)
    return NextResponse.json({ following: false })
  }

  const { error } = await supabase
    .from('fan_follows')
    .upsert({ fan_profile_id: profile.id, artist_id: artistId }, { onConflict: 'fan_profile_id,artist_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ following: true })
}
