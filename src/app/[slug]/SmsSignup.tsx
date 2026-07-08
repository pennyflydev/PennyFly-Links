'use client'

import { useState } from 'react'
import { MessageSquare, Check, Loader2 } from 'lucide-react'

export default function SmsSignup({
  slug,
  artistName,
  radiusClass = 'rounded-xl',
}: {
  slug: string
  artistName: string
  radiusClass?: string
}) {
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'working') return
    setError(null)
    if (!consent) return setError('Please check the box to agree.')
    setStatus('working')
    try {
      const res = await fetch('/api/sms/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, phone, consent }),
      })
      const data = await res.json()
      if (res.ok) setStatus('done')
      else {
        setError(data.error ?? 'Could not sign up')
        setStatus('idle')
      }
    } catch {
      setError('Could not sign up — please try again.')
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div className={`w-full bg-white/10 border border-white/20 ${radiusClass} p-4 flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-green-400" />
        </div>
        <p className="text-sm text-white/80">You&apos;re on the list. We&apos;ll text you when there&apos;s a drop.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={`w-full bg-white/10 border border-white/20 ${radiusClass} p-4 space-y-3`}>
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <MessageSquare className="w-4 h-4" />
        Get {artistName || 'drop'} alerts by text
      </div>
      <input
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Your phone number"
        className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40"
      />
      <label className="flex items-start gap-2 text-[11px] text-white/50 leading-snug">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>
          I agree to receive recurring automated marketing texts from {artistName || 'this artist'}. Consent is not a
          condition of purchase. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
        </span>
      </label>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={status === 'working'}
        className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {status === 'working' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
        Text me drops
      </button>
    </form>
  )
}
