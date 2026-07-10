'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, DollarSign } from 'lucide-react'

type Tip = {
  id: string
  amount_cents: number
  supporter_name: string | null
  message: string | null
  created_at: string
}

export default function TipsClient({
  initialEnabled,
  chargesEnabled,
  billingReady,
  tips,
  total,
}: {
  initialEnabled: boolean
  chargesEnabled: boolean
  billingReady: boolean
  tips: Tip[]
  total: number
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [toggleBusy, setToggleBusy] = useState(false)

  async function toggle(next: boolean) {
    setToggleBusy(true)
    setEnabled(next)
    try {
      const res = await fetch('/api/artist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tips_enabled: next }),
      })
      if (!res.ok) setEnabled(!next)
    } catch {
      setEnabled(!next)
    }
    setToggleBusy(false)
  }

  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tip Jar</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Let fans send you a one-off tip from your page. Money goes straight to your connected Stripe account minus the
          2.5% platform fee — FlyLink never holds your funds.
        </p>
      </div>

      {!billingReady && (
        <div className="mb-6 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-300">
          Payments aren&apos;t connected on this deployment yet. Once Stripe is configured, tips will go live.
        </div>
      )}

      {billingReady && !chargesEnabled && (
        <div className="mb-6 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-300">
          You need to set up payouts before the tip jar can show on your page.{' '}
          <Link href="/dashboard/payments" className="underline font-medium">
            Set up payments
          </Link>
          .
        </div>
      )}

      {/* Enable + total */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Show the tip jar on my page</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Adds a &ldquo;Support&rdquo; box with preset and custom amounts. Only appears once payouts are set up.
            </p>
          </div>
          <button
            onClick={() => toggle(!enabled)}
            disabled={toggleBusy}
            role="switch"
            aria-checked={enabled}
            className={`relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50 ${enabled ? 'bg-yellow-400' : 'bg-zinc-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Received
          </div>
          <p className="text-2xl font-bold text-white">{money(total)}</p>
          <p className="text-[11px] text-zinc-600">{tips.length} tip{tips.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {/* Recent tips */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4 text-yellow-400" />
          <h2 className="font-semibold text-white">Recent tips</h2>
        </div>
        {tips.length === 0 ? (
          <p className="text-sm text-zinc-500">No tips yet. Turn on the tip jar and share your page.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {tips.map((t) => (
              <li key={t.id} className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{t.supporter_name?.trim() || 'Anonymous'}</p>
                  {t.message?.trim() && <p className="text-xs text-zinc-400 mt-0.5 break-words">{t.message}</p>}
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-400 shrink-0">{money(t.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
