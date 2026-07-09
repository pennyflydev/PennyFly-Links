import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  return NextResponse.json({ artist })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const allowed = ['artist_name', 'bio', 'genres', 'avatar_url', 'cover_url', 'theme', 'background_type', 'background_value', 'subdomain', 'meta_pixel_id', 'tiktok_pixel_id', 'ga_measurement_id', 'fan_wall_enabled', 'seo_title', 'seo_description', 'hide_branding', 'font', 'button_style', 'shopify_domain', 'shopify_token', 'wallet_pass_enabled', 'sms_enabled', 'tips_enabled']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('artists')
    .update(updates)
    .eq('id', artist.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ artist: data })
}
