'use client'

import { useState } from 'react'
import { MessageSquare, Send, Loader2, Users } from 'lucide-react'

export default function SmsClient({
  initialEnabled,
  activeCount,
  totalCount,
  twilioReady,
}: {
  initialEnabled: boolean
  activeCount: number
  totalCount: number
  twilioReady: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [toggleBusy, setToggleBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(next: boolean) {
    setToggleBusy(true)
    setEnabled(next)
    try {
      const res = await fetch('/api/artist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sms_enabled: next }),
      })
      if (!res.ok) setEnabled(!next)
    } catch {
      setEnabled(!next)
    }
    setToggleBusy(false)
  }

  async function broadcast() {
    if (!message.trim() || sending) return
    setSending(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/sms/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(`Sent to ${data.sent} of ${data.total} subscribers.`)
        setMessage('')
      } else {
        setError(data.error ?? 'Could not send')
      }
    } catch {
      setError('Could not send — please try again.')
    }
    setSending(false)
  }

  const remaining = 320 - message.length

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">SMS Drop Alerts</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Text is the highest-engagement channel in music. Collect opt-ins on your page and blast a drop the moment
          it&apos;s live.
        </p>
      </div>

      {!twilioReady && (
        <div className="mb-6 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-300">
          SMS sending isn&apos;t connected yet. Opt-ins are still collected — once Twilio is configured (number +
          10DLC registration), you can broadcast. Confirmation texts and sends stay off until then.
        </div>
      )}

      {/* Enable + stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Show the SMS signup on my page</p>
            <p className="text-xs text-zinc-500 mt-0.5">Adds an opt-in box with a consent checkbox to your public page.</p>
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
            <Users className="w-3.5 h-3.5" /> Subscribers
          </div>
          <p className="text-2xl font-bold text-white">{activeCount.toLocaleString()}</p>
          {totalCount > activeCount && (
            <p className="text-[11px] text-zinc-600">{(totalCount - activeCount).toLocaleString()} opted out</p>
          )}
        </div>
      </div>

      {/* Broadcast */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-yellow-400" />
          <h2 className="font-semibold text-white">Send a drop alert</h2>
        </div>
        <textarea
          rows={4}
          maxLength={320}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="New single out now — listen here: …"
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-zinc-600">
            {remaining} left · &ldquo;Reply STOP to opt out&rdquo; is appended automatically
          </p>
          <button
            onClick={broadcast}
            disabled={sending || !message.trim() || !twilioReady || activeCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending…' : `Send to ${activeCount}`}
          </button>
        </div>
        {result && <p className="text-xs text-green-400 mt-2">{result}</p>}
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      <p className="text-[11px] text-zinc-600 mt-4 leading-relaxed">
        Compliance: fans opt in with an explicit consent checkbox; every message includes opt-out instructions; STOP,
        START, and HELP replies are handled automatically. US A2P sending requires 10DLC brand/campaign registration
        with your Twilio number.
      </p>
    </div>
  )
}
