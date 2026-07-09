'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

// A paid exclusive: fan pays to reveal the reward. Starts a Stripe Connect
// checkout; the reward is revealed on /unlock/success after payment (never
// exposed on the public page).
export default function PaidUnlockButton({
  exclusiveId,
  priceCents,
  radiusClass,
  children,
}: {
  exclusiveId: string
  priceCents: number
  radiusClass: string
  children: React.ReactNode
}) {
  const [busy, setBusy] = useState(false)

  async function buy() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/connect/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'paid_unlock', id: exclusiveId }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setBusy(false)
    } catch {
      setBusy(false)
    }
  }

  const price = `$${(priceCents / 100).toFixed(priceCents % 100 ? 2 : 0)}`

  return (
    <button
      onClick={buy}
      disabled={busy}
      className={`flex items-center gap-3 w-full bg-white/10 border border-white/20 ${radiusClass} p-3 hover:bg-white/15 disabled:opacity-60 transition-colors`}
    >
      {children}
      <span className="text-xs font-semibold text-black bg-white rounded-full px-3 py-1.5 shrink-0 min-w-[52px] flex items-center justify-center">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : price}
      </span>
    </button>
  )
}
