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

  const { kind, id } = await req.json().catch(() => ({}))
  const supabase = createAdminClient()
  const origin = process.env.NEXT_PUBLIC_PROD_URL || process.env.NEXT_PUBLIC_APP_URL || ''

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
