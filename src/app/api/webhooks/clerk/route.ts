import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return new Response('Webhook secret not configured', { status: 500 })

  const headerStore = await headers()
  const svixId = headerStore.get('svix-id')
  const svixTimestamp = headerStore.get('svix-timestamp')
  const svixSignature = headerStore.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()

  let evt: { type: string; data: Record<string, unknown> }
  try {
    const wh = new Webhook(secret)
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof evt
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const supabase = createAdminClient()

  if (evt.type === 'user.created') {
    const data = evt.data as {
      id: string
      email_addresses: { email_address: string }[]
      first_name?: string
      last_name?: string
    }

    const clerkId = data.id
    const email = data.email_addresses[0]?.email_address ?? ''
    const firstName = data.first_name ?? ''
    const lastName = data.last_name ?? ''
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0]
    const isAdmin = clerkId === process.env.ADMIN_CLERK_USER_ID

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        clerk_id: clerkId,
        email,
        role: isAdmin ? 'admin' : 'artist',
        plan: isAdmin ? 'signed' : 'starter',
      })
      .select()
      .single()

    if (profileError || !profile) {
      console.error('Profile insert failed:', profileError)
      return new Response('Profile creation failed', { status: 500 })
    }

    // Generate unique slug
    const baseSlug = slugify(email.split('@')[0]) || `artist-${clerkId.slice(-8)}`
    let slug = baseSlug
    let attempt = 0

    while (attempt < 5) {
      const { data: existing } = await supabase
        .from('artists')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existing) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    // Create artist row
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .insert({
        profile_id: profile.id,
        artist_name: displayName,
        slug,
        is_signed: isAdmin,
      })
      .select()
      .single()

    if (artistError || !artist) {
      console.error('Artist insert failed:', artistError)
      return new Response('Artist creation failed', { status: 500 })
    }

    // Seed default page sections
    await supabase.from('artist_page_sections').insert([
      { artist_id: artist.id, section: 'bio', is_visible: true, sort_order: 0 },
      { artist_id: artist.id, section: 'flylinks', is_visible: true, sort_order: 1 },
      { artist_id: artist.id, section: 'presave', is_visible: true, sort_order: 2 },
      { artist_id: artist.id, section: 'custom_links', is_visible: false, sort_order: 3 },
      { artist_id: artist.id, section: 'email_capture', is_visible: false, sort_order: 4 },
    ])
  }

  if (evt.type === 'user.deleted') {
    const data = evt.data as { id: string }
    await supabase.from('profiles').delete().eq('clerk_id', data.id)
  }

  return new Response('OK', { status: 200 })
}
