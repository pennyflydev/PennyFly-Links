'use client'

import { useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'

export default function NotifyFansButton() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function notify() {
    const body = window.prompt('Message to send your subscribed fans:', 'New drop — tap to listen')
    if (body === null) return
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json()
      setMsg(res.ok ? `Sent to ${data.sent} fan${data.sent === 1 ? '' : 's'}` : data.error ?? 'Could not send')
    } catch {
      setMsg('Could not send')
    }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-zinc-400">{msg}</span>}
      <button
        onClick={notify}
        disabled={busy}
        className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
        Notify fans
      </button>
    </div>
  )
}
