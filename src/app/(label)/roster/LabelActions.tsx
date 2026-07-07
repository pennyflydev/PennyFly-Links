'use client'

import { useState } from 'react'
import { Megaphone, Download, Loader2 } from 'lucide-react'

export default function LabelActions() {
  const [busy, setBusy] = useState<'cast' | 'export' | null>(null)
  const [msg, setMsg] = useState('')

  async function broadcast() {
    const body = window.prompt('Message to send every fan across your roster:', '')
    if (!body) return
    setBusy('cast')
    setMsg('')
    try {
      const res = await fetch('/api/label/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json()
      setMsg(res.ok ? `Sent to ${data.sent} fan${data.sent === 1 ? '' : 's'}` : data.error ?? 'Could not send')
    } catch {
      setMsg('Could not send')
    }
    setBusy(null)
  }

  async function exportCsv() {
    setBusy('export')
    setMsg('')
    try {
      const res = await fetch('/api/label/subscribers')
      const data = await res.json()
      const rows: { email: string; name: string | null; artist: string; source: string; country: string | null; created_at: string }[] = data.subscribers ?? []
      const header = ['Email', 'Name', 'Artist', 'Source', 'Country', 'Date']
      const lines = rows.map((s) =>
        [s.email, s.name ?? '', s.artist, s.source, s.country ?? '', new Date(s.created_at).toISOString().split('T')[0]]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      const csv = [header.join(','), ...lines].join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `roster-subscribers-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setMsg(`${rows.length} fans exported`)
    } catch {
      setMsg('Could not export')
    }
    setBusy(null)
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-zinc-400">{msg}</span>}
      <button onClick={exportCsv} disabled={busy !== null}
        className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors">
        {busy === 'export' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Export fans
      </button>
      <button onClick={broadcast} disabled={busy !== null}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors">
        {busy === 'cast' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
        Broadcast
      </button>
    </div>
  )
}
