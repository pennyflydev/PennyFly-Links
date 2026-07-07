'use client'

import { useState } from 'react'
import { MessageSquare, Pin, Trash2, Loader2 } from 'lucide-react'

type Note = { id: string; name: string; message: string; is_pinned: boolean; created_at: string }

export default function FanWallClient({
  enabled: initialEnabled,
  notes: initialNotes,
  artistSlug,
}: {
  enabled: boolean
  notes: Note[]
  artistSlug: string
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [notes, setNotes] = useState(initialNotes)
  const [busy, setBusy] = useState<string | null>(null)

  async function toggleEnabled() {
    setBusy('toggle')
    const res = await fetch('/api/artist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fan_wall_enabled: !enabled }),
    })
    if (res.ok) setEnabled((e) => !e)
    setBusy(null)
  }

  async function togglePin(note: Note) {
    setBusy(note.id)
    const res = await fetch(`/api/fan-wall/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !note.is_pinned }),
    })
    if (res.ok) setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n)).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)))
    setBusy(null)
  }

  async function remove(note: Note) {
    if (!confirm('Remove this note?')) return
    setBusy(note.id)
    const res = await fetch(`/api/fan-wall/${note.id}`, { method: 'DELETE' })
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== note.id))
    setBusy(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Fan Wall</h1>
          <p className="text-sm text-zinc-400 mt-1">Let fans leave notes on your artist page. Pin the best ones.</p>
        </div>
        <a href={`/${artistSlug}`} target="_blank" className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">
          View page
        </a>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-medium text-white">Fan Wall {enabled ? 'on' : 'off'}</p>
          <p className="text-xs text-zinc-500">When on, a note form appears on your public artist page.</p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={busy === 'toggle'}
          className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${enabled ? 'bg-yellow-400 justify-end' : 'bg-zinc-700 justify-start'}`}
        >
          <span className="w-5 h-5 bg-white rounded-full shadow" />
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="w-10 h-10 text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-sm">No notes yet.</p>
          <p className="text-zinc-600 text-xs mt-1">Turn the wall on and share your page — fan notes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className={`bg-zinc-900 border rounded-xl p-4 flex items-start justify-between gap-4 ${n.is_pinned ? 'border-yellow-400/40' : 'border-zinc-800'}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{n.name}</span>
                  {n.is_pinned && <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center gap-1"><Pin className="w-3 h-3" />Pinned</span>}
                  <span className="text-xs text-zinc-600">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <p className="text-sm text-zinc-300 break-words">{n.message}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => togglePin(n)} disabled={busy === n.id} title={n.is_pinned ? 'Unpin' : 'Pin'}
                  className={`p-1.5 rounded-lg transition-colors ${n.is_pinned ? 'text-yellow-400' : 'text-zinc-500 hover:text-white'}`}>
                  {busy === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pin className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(n)} disabled={busy === n.id} title="Remove" className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
