'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Ticket, Plus, Trash2, ScanLine, Loader2, DollarSign, Users, CheckCircle2, ArrowLeft } from 'lucide-react'

export type TicketType = {
  id: string
  name: string
  price_cents: number
  quantity: number | null
  sold: number
  is_active: boolean
}

export default function TicketsManageClient({
  eventId,
  eventTitle,
  eventSlug,
  initialTypes,
  totalSold,
  checkedIn,
  revenueCents,
}: {
  eventId: string
  eventTitle: string
  eventSlug: string
  initialTypes: TicketType[]
  totalSold: number
  checkedIn: number
  revenueCents: number
}) {
  const router = useRouter()
  const [types, setTypes] = useState(initialTypes)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addType(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/ticket-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name,
          priceCents: Math.round((parseFloat(price) || 0) * 100),
          quantity: qty.trim() === '' ? null : parseInt(qty, 10),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTypes((t) => [...t, data.ticketType])
        setName(''); setPrice(''); setQty('')
      } else setError(data.error ?? 'Could not add')
    } catch {
      setError('Could not add ticket type')
    }
    setBusy(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this ticket type?')) return
    const res = await fetch(`/api/ticket-types/${id}`, { method: 'DELETE' })
    if (res.ok) setTypes((t) => t.filter((x) => x.id !== id))
  }

  const stats = [
    { label: 'Tickets sold', value: totalSold.toLocaleString(), icon: Ticket },
    { label: 'Checked in', value: checkedIn.toLocaleString(), icon: CheckCircle2 },
    { label: 'Revenue', value: `$${(revenueCents / 100).toFixed(2)}`, icon: DollarSign },
  ]

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/events" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Events
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-sm text-zinc-400 mt-1">{eventTitle}</p>
        </div>
        <Link
          href={`/dashboard/events/${eventId}/scan`}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors"
        >
          <ScanLine className="w-4 h-4" /> Door scanner
        </Link>
      </div>

      {/* Reporting */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <Icon className="w-3.5 h-3.5" /> {label}
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Ticket types */}
      <h2 className="text-sm font-semibold text-white mb-3">Ticket types</h2>
      <div className="space-y-2 mb-6">
        {types.length === 0 && <p className="text-sm text-zinc-500">No ticket types yet. Add one below.</p>}
        {types.map((t) => (
          <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{t.name}</p>
              <p className="text-xs text-zinc-500">
                {t.price_cents > 0 ? `$${(t.price_cents / 100).toFixed(2)}` : 'Free'} ·{' '}
                {t.sold}{t.quantity != null ? ` / ${t.quantity}` : ''} sold
              </p>
            </div>
            <button onClick={() => remove(t.id)} title="Delete" className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={addType} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <p className="text-sm font-medium text-white">Add a ticket type</p>
        <div className="grid grid-cols-2 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. General Admission"
            className="col-span-2 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00 (free)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
          </div>
          <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="0" placeholder="Qty (blank = ∞)"
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" disabled={busy || !name.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add ticket type
        </button>
      </form>

      <p className="text-[11px] text-zinc-600 mt-4">
        Paid tickets require payouts set up in <Link href="/dashboard/payments" className="underline hover:text-zinc-400">Payments</Link>. Free tickets work right away.
      </p>
      <button onClick={() => router.refresh()} className="text-xs text-zinc-500 hover:text-white mt-2 flex items-center gap-1">
        <Users className="w-3 h-3" /> Refresh numbers
      </button>
    </div>
  )
}
