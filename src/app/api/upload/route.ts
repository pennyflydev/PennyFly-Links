import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getArtistForCurrentUser, getCurrentProfile, getLabelForProfile } from '@/lib/supabase/queries'

const BUCKET = 'media'
const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Artists upload under their id; label accounts under their label id.
  const artist = await getArtistForCurrentUser()
  let prefix = artist?.id as string | undefined
  if (!prefix) {
    const profile = await getCurrentProfile()
    const label = profile ? await getLabelForProfile(profile.id) : null
    if (label) prefix = `label-${label.id}`
  }
  if (!prefix) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const kind = (form.get('kind') as string) || 'image'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Only JP, PNG, WEBP, or GIF images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Ensure the public bucket exists (idempotent — ignores "already exists").
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${prefix}/${kind}-${Date.now()}.${ext}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
