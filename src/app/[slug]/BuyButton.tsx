'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

// Buys a store product. If the artist has native payments (Stripe Connect)
// enabled, it opens a Stripe Checkout; otherwise it falls back to their
// external buy link. Renders nothing if neither is available.
export default function BuyButton({
  productId,
  buyUrl,
  nativeCheckout,
  className,
}: {
  productId: string
  buyUrl: string | null
  nativeCheckout: boolean
  className: string
}) {
  const [busy, setBusy] = useState(false)

  async function buyNative() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/connect/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'product', id: productId }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      // Fall back to the external link if native checkout failed.
      if (buyUrl) window.open(buyUrl, '_blank', 'noopener')
      else setBusy(false)
    } catch {
      if (buyUrl) window.open(buyUrl, '_blank', 'noopener')
      setBusy(false)
    }
  }

  if (nativeCheckout) {
    return (
      <button onClick={buyNative} disabled={busy} className={className}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
      </button>
    )
  }

  if (buyUrl) {
    return (
      <a href={buyUrl} target="_blank" rel="noopener noreferrer" className={className}>
        Buy
      </a>
    )
  }

  return null
}
