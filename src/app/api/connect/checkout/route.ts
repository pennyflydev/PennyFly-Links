import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isBillingConfigured } from '@/lib/stripe'
import { createConnectCheckout } from '@/lib/stripe/connect'

// Fan-initiated purchase that pays an artist directly (destination charge).
// kind: 'product' (store). More kinds (tip, unlock) reuse this shape.
export async function POST(req: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: 'Payments aren’t available right now.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const { kind, id } = body
  const supabase = createAdminClient()
  const origin = process.env.NEXT_PUBLIC_PROD_URL || process.env.NEXT_PUBLIC_APP_URL || ''

  if (kind === 'tip') {
    const amountCents = Math.round(Number(body.amountCents))
    if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 100000) {
      return NextResponse.json({ error: 'Enter an amount between $1 and $1000.' }, { status: 400 })
    }

    const { data: artist } = await supabase
      .from('artists')
      .select('id, slug, artist_name, tips_enabled, stripe_account_id, stripe_charges_enabled')
      .eq('id', body.artistId)
      .single()
    if (!artist || !artist.tips_enabled) {
      return NextResponse.json({ error: 'Tips aren’t available for this artist.' }, { status: 404 })
    }
    if (!artist.stripe_account_id || !artist.stripe_charges_enabled) {
      return NextResponse.json({ error: 'This artist isn’t set up to take payments yet.' }, { status: 400 })
    }

    const supporterName = String(body.name ?? '').trim().slice(0, 120)
    const message = String(body.message ?? '').trim().slice(0, 500)

    const url = await createConnectCheckout({
      destinationAccountId: artist.stripe_account_id,
      amountCents,
      productName: `Tip for ${artist.artist_name || 'the artist'}`,
      metadata: {
        kind: 'tip',
        artistId: artist.id,
        ...(supporterName ? { supporterName } : {}),
        ...(message ? { message } : {}),
      },
      successUrl: `${origin}/${artist.slug}?tip=success`,
      cancelUrl: `${origin}/${artist.slug}?tip=cancelled`,
    })
    if (!url) return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
    return NextResponse.json({ url })
  }

  if (kind === 'paid_unlock') {
    const { data: item } = await supabase
      .from('exclusive_content')
      .select('id, title, price_cents, is_active, artist_id')
      .eq('id', id)
      .single()
    if (!item || !item.is_active) return NextResponse.json({ error: 'Not available' }, { status: 404 })
    if (item.price_cents <= 0) return NextResponse.json({ error: 'This unlock is free.' }, { status: 400 })

    const { data: artist } = await supabase
      .from('artists')
      .select('slug, stripe_account_id, stripe_charges_enabled')
      .eq('id', item.artist_id)
      .single()
    if (!artist?.stripe_account_id || !artist.stripe_charges_enabled) {
      return NextResponse.json({ error: 'This artist isn’t set up to take payments yet.' }, { status: 400 })
    }

    const url = await createConnectCheckout({
      destinationAccountId: artist.stripe_account_id,
      amountCents: item.price_cents,
      productName: item.title,
      metadata: { kind: 'paid_unlock', exclusiveId: item.id, artistId: item.artist_id },
      successUrl: `${origin}/unlock/success?s={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/${artist.slug}?unlock=cancelled`,
    })
    if (!url) return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
    return NextResponse.json({ url })
  }

  if (kind === 'product') {
    const { data: product } = await supabase
      .from('products')
      .select('id, title, price_cents, cover_url, is_published, artist_id')
      .eq('id', id)
      .single()
    if (!product || !product.is_published) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    if (product.price_cents <= 0) {
      return NextResponse.json({ error: 'This item isn’t for sale.' }, { status: 400 })
    }

    const { data: artist } = await supabase
      .from('artists')
      .select('slug, stripe_account_id, stripe_charges_enabled')
      .eq('id', product.artist_id)
      .single()
    if (!artist?.stripe_account_id || !artist.stripe_charges_enabled) {
      return NextResponse.json({ error: 'This artist isn’t set up to take payments yet.' }, { status: 400 })
    }

    const url = await createConnectCheckout({
      destinationAccountId: artist.stripe_account_id,
      amountCents: product.price_cents,
      productName: product.title,
      imageUrl: product.cover_url,
      metadata: { kind: 'product', productId: product.id, artistId: product.artist_id },
      successUrl: `${origin}/${artist.slug}?purchase=success`,
      cancelUrl: `${origin}/${artist.slug}?purchase=cancelled`,
    })
    if (!url) return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 })
    return NextResponse.json({ url })
  }

  return NextResponse.json({ error: 'Unsupported checkout type' }, { status: 400 })
}
