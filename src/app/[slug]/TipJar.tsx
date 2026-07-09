'use client'

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'

const PRESETS = [3, 5, 10] // dollars

export default function TipJar({
  artistId,
  artistName,
  radiusClass,
}: {
  artistId: string
  artistName: string
  radiusClass: string
}) {
  const [amount, setAmount] = useState<number>(5) // dollars
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dollars = custom.trim() ? Number(custom) : amount
  const valid = Number.isFinite(dollars) && dollars >= 1 && dollars <= 1000

  async function send() {
    if (!valid || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/connect/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'tip',
          artistId,
          amountCents: Math.round(dollars * 100),
          name: name.trim(),
          message: message.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? 'Could not start checkout.')
    } catch {
      setError('Could not start checkout — please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="w-full space-y-2">
      <p className="text-xs font-medium text-white/50 uppercase tracking-wider px-1">Support {artistName}</p>
      <div className={`w-full bg-white/10 border border-white/20 ${radiusClass} p-4 space-y-3`}>
        <div className="flex items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setAmount(p)
                setCustom('')
              }}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                !custom.trim() && amount === p ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              ${p}
            </button>
          ))}
          <div className="flex items-center bg-white/10 rounded-full px-3 py-2 flex-1">
            <span className="text-sm text-white/50">$</span>
            <input
              inputMode="decimal"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="Other"
              className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none ml-1 min-w-0"
            />
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Your name (optional)"
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Say something (optional)"
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 resize-none"
        />

        <button
          onClick={send}
          disabled={!valid || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
          {loading ? 'Starting…' : valid ? `Send $${dollars.toFixed(dollars % 1 ? 2 : 0)}` : 'Send a tip'}
        </button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </div>
  )
}
