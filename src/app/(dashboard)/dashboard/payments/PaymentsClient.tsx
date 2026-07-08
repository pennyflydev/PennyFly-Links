'use client'

import { useState } from 'react'
import { CreditCard, Loader2, Check, ExternalLink, AlertCircle } from 'lucide-react'

export default function PaymentsClient({
  billingReady,
  hasAccount,
  chargesEnabled,
  detailsSubmitted,
  feePercent,
}: {
  billingReady: boolean
  hasAccount: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  feePercent: number
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go(endpoint: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? 'Something went wrong')
    } catch {
      setError('Something went wrong — please try again.')
    }
    setBusy(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Get paid directly by fans for your store, tips, memberships, and unlocks. Payouts go to your own bank
          through Stripe — FlyLink never holds your money.
        </p>
      </div>

      {!billingReady ? (
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-300">
          Payments aren&apos;t connected on the platform yet. Once Stripe is configured, you&apos;ll be able to set up
          payouts here.
        </div>
      ) : chargesEnabled ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Payouts active</p>
              <p className="text-xs text-zinc-500">You can take payments. FlyLink&apos;s fee is {feePercent}% per sale.</p>
            </div>
          </div>
          <button
            onClick={() => go('/api/connect/login')}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Open Stripe dashboard
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Set up payouts</p>
              <p className="text-xs text-zinc-500">
                {hasAccount && detailsSubmitted
                  ? 'Almost there — Stripe needs a little more info to enable payouts.'
                  : 'A quick Stripe-hosted setup (bank details + ID). No existing Stripe account needed.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => go('/api/connect/onboard')}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {hasAccount ? 'Continue setup' : 'Set up payouts'}
          </button>
          <p className="text-xs text-zinc-600">Powered by Stripe. FlyLink&apos;s fee is {feePercent}% per sale.</p>
        </div>
      )}

      {error && (
        <p className="mt-4 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  )
}
