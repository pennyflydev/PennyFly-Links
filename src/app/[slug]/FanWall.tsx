'use client'

import { useState } from 'react'
import { MessageSquare, Pin, Check, Loader2 } from 'lucide-react'

type Note = { id: string; name: string; message: string; is_pinned: boolean; created_at: string }

export default function FanWall({ slug, notes }: { slug: string; notes: Note[] }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const sorted = [...notes]
    .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 30)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('saving')
    try {
      const res = await fetch('/api/fan-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, message, website }),
      })
      setStatus(res.ok ? 'done' : 'error')
      if (res.ok) { setName(''); setMessage('') }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="w-full space-y-3">
      <p className="text-xs font-medium text-white/50 uppercase tracking-wider px-1 flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" /> Fan Wall
      </p>

      {status === 'done' ? (
        <div className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-2 text-sm text-white/80">
          <Check className="w-4 h-4 text-green-400" /> Thanks for your note!
        </div>
      ) : (
        <form onSubmit={submit} className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" maxLength={60}
            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Leave a note…" rows={2} maxLength={280}
            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 resize-none" />
          <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"
            className="hidden" aria-hidden="true" />
          <button type="submit" disabled={status === 'saving' || !message.trim()}
            className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />} Post note
          </button>
          {status === 'error' && <p className="text-red-300 text-xs">Something went wrong. Try again.</p>}
        </form>
      )}

      {sorted.map((n) => (
        <div key={n.id} className={`w-full rounded-2xl px-4 py-3 border ${n.is_pinned ? 'bg-white/15 border-white/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{n.name}</span>
            {n.is_pinned && <Pin className="w-3 h-3 text-white/50" />}
          </div>
          <p className="text-sm text-white/80 break-words">{n.message}</p>
        </div>
      ))}
    </div>
  )
}
