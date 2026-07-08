'use client'

import { useState } from 'react'
import { Star, Trash2, Loader2, Plus } from 'lucide-react'

export type Tier = {
  id: string
  name: string
  price_cents: number
  interval: string
  description: string
  perks: string[]
  join_url: string | null
  is_active: boolean
}

const blank = { name: '', price: '', interval: 'month', description: '', perks: '', buyUrl: '' }

export default function MembershipClient({ initialTiers }: { initialTiers: Tier[] }) {
  const [tiers, setTiers] = useState(initialTiers)
  const [form, setForm] = useState(blank)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  async function create() {
    setBusy('new')
    const res = await fetch('/api/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        priceCents: Math.round((parseFloat(form.price) || 0) * 100),
        interval: form.interval,
        description: form.description,
        perks: form.perks.split('\n').map((p) => p.trim()).filter(Boolean),
        buyUrl: form.buyUrl,
      }),
    })
    const data = await res.json()
    if (res.ok) { setTiers((p) => [...p, data.tier]); setForm(blank); setOpen(false) }
    setBusy(null)
  }

  async function toggle(t: Tier) {
    setBusy(t.id)
    const res = await fetch(`/api/memberships/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !t.is_active }),
    })
    if (res.ok) setTiers((p) => p.map((x) => (x.id === t.id ? { ...x, is_active: !x.is_active } : x)))
    setBusy(null)
  }

  async function remove(t: Tier) {
    if (!confirm(`Delete the "${t.name}" tier?`)) return
    setBusy(t.id)
    const res = await fetch(`/api/memberships/${t.id}`, { method: 'DELETE' })
    if (res.ok) setTiers((p) => p.filter((x) => x.id !== t.id))
    setBusy(null)
  }

  const money = (c: number) => (c > 0 ? `$${(c / 100).toFixed(2)}` : 'Free')

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />New tier
        </button>
      </div>

      {open && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tier name — e.g. Superfan"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
            <div className="flex gap-2">
              <div className="flex rounded-lg overflow-hidden border border-zinc-700 flex-1">
                <span className="px-3 py-2 bg-zinc-800 text-zinc-400 text-sm border-r border-zinc-700">$</span>
                <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="5.00"
                  className="flex-1 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none" />
              </div>
              <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none">
                <option value="month">/mo</option>
                <option value="year">/yr</option>
              </select>
            </div>
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <textarea value={form.perks} onChange={(e) => setForm({ ...form, perks: e.target.value })} rows={3} placeholder="Perks — one per line"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none" />
          <input value={form.buyUrl} onChange={(e) => setForm({ ...form, buyUrl: e.target.value })} placeholder="Join link (Patreon / Bandcamp) — native checkout coming with billing"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <button onClick={create} disabled={busy === 'new' || !form.name}
            className="px-5 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
            {busy === 'new' && <Loader2 className="w-4 h-4 animate-spin" />}Add tier
          </button>
        </div>
      )}

      {tiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4"><Star className="w-7 h-7 text-yellow-400" /></div>
          <h2 className="text-xl font-semibold text-white mb-2">No membership tiers yet</h2>
          <p className="text-zinc-400 text-sm max-w-sm">Offer recurring perks — early access, exclusive tracks, shoutouts — and turn fans into members.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div key={t.id} className={`bg-zinc-900 border rounded-xl p-5 ${t.is_active ? 'border-zinc-800' : 'border-zinc-800 opacity-60'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-zinc-400">{money(t.price_cents)}<span className="text-zinc-600">/{t.interval === 'year' ? 'yr' : 'mo'}</span></p>
                </div>
                <button onClick={() => remove(t)} disabled={busy === t.id} className="p-1 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
              {t.description && <p className="text-xs text-zinc-500 mb-3">{t.description}</p>}
              {t.perks?.length > 0 && (
                <ul className="space-y-1 mb-3">
                  {t.perks.map((p, i) => <li key={i} className="text-xs text-zinc-400 flex gap-1.5"><span className="text-yellow-400">✓</span>{p}</li>)}
                </ul>
              )}
              <button onClick={() => toggle(t)} disabled={busy === t.id}
                className="w-full py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors">
                {busy === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : t.is_active ? 'Live · Pause' : 'Paused · Publish'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
