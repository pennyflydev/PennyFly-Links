'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, CalendarDays, Copy, Trash2, Check, Loader2, MapPin } from 'lucide-react'

export type EventRow = {
  id: string
  title: string
  slug: string
  start_at: string
  venue: string
  city: string
  is_published: boolean
}

export default function EventsListClient({ initialEvents }: { initialEvents: EventRow[] }) {
  const [events, setEvents] = useState(initialEvents)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function togglePublish(ev: EventRow) {
    setBusy(ev.id)
    const res = await fetch(`/api/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !ev.is_published }),
    })
    if (res.ok) setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, is_published: !e.is_published } : e)))
    setBusy(null)
  }

  async function remove(ev: EventRow) {
    if (!confirm(`Delete "${ev.title}"?`)) return
    setBusy(ev.id)
    const res = await fetch(`/api/events/${ev.id}`, { method: 'DELETE' })
    if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== ev.id))
    setBusy(null)
  }

  function copyLink(ev: EventRow) {
    navigator.clipboard.writeText(`${window.location.origin}/events/${ev.slug}`)
    setCopied(ev.id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
          <CalendarDays className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No events yet</h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm">Create a landing page for your next show, listening session, or album launch.</p>
        <Link href="/dashboard/events/create" className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />Create Your First Event
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <div key={ev.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-white">{ev.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.is_published ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                {ev.is_published ? 'Live' : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-2">
              {new Date(ev.start_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {(ev.venue || ev.city) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[ev.venue, ev.city].filter(Boolean).join(', ')}</span>}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => copyLink(ev)} title="Copy link" className="p-1.5 text-zinc-500 hover:text-white transition-colors">
              {copied === ev.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <a href={`/events/${ev.slug}`} target="_blank" className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">View</a>
            <Link href={`/dashboard/events/${ev.id}/edit`} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">Edit</Link>
            <button onClick={() => togglePublish(ev)} disabled={busy === ev.id}
              className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors min-w-[78px]">
              {busy === ev.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : ev.is_published ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => remove(ev)} disabled={busy === ev.id} title="Delete" className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
