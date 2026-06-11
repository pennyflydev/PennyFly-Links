import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser } from '@/lib/supabase/queries'

const VALID_SECTIONS = ['bio', 'flylinks', 'presave', 'custom_links', 'email_capture']

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ sections: [] })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('artist_page_sections')
    .select('section, is_visible, sort_order')
    .eq('artist_id', artist.id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ sections: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const artist = await getArtistForCurrentUser()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })

  const body = await req.json()
  const incoming = body.sections as { section: string; is_visible: boolean; sort_order: number }[]
  if (!Array.isArray(incoming)) {
    return NextResponse.json({ error: 'sections array required' }, { status: 400 })
  }

  const rows = incoming
    .filter((s) => VALID_SECTIONS.includes(s.section))
    .map((s) => ({
      artist_id: artist.id,
      section: s.section,
      is_visible: s.is_visible,
      sort_order: s.sort_order,
    }))

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('artist_page_sections')
    .upsert(rows, { onConflict: 'artist_id,section' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
