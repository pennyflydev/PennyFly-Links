'use client'

import { useEffect, useState } from 'react'
import { Lock, Trash2, Loader2, Plus } from 'lucide-react'

type Item = { id: string; title: string; description: string; reward_url: string; cover_url: string | null; is_active: boolean; price_cents: number }

export default function ExclusiveClient() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [rewardUrl, setRewardUrl] = useState('')
  const [price, setPrice] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/exclusive').then((r) => r.json()).then((d) => setItems(d.items ?? [])).finally(() => setLoading(false))
  }, [])

  async function uploadCover(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append('file', file); form.append('kind', 'exclusive')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok) setCoverUrl(data.url)
    setUploading(false)
  }

  async function create() {
    setBusy('new')
    const res = await fetch('/api/exclusive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, rewardUrl, coverUrl, priceCents: Math.round((parseFloat(price) || 0) * 100) }),
    })
    const data = await res.json()
    if (res.ok) { setItems((p) => [...p, data.item]); setTitle(''); setDescription(''); setRewardUrl(''); setPrice(''); setCoverUrl(null); setOpen(false) }
    setBusy(null)
  }

  async function toggle(it: Item) {
    setBusy(it.id)
    const res = await fetch(`/api/exclusive/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !it.is_active }) })
    if (res.ok) setItems((p) => p.map((x) => (x.id === it.id ? { ...x, is_active: !x.is_active } : x)))
    setBusy(null)
  }

  async function remove(it: Item) {
    if (!confirm(`Delete "${it.title}"?`)) return
    setBusy(it.id)
    const res = await fetch(`/api/exclusive/${it.id}`, { method: 'DELETE' })
    if (res.ok) setItems((p) => p.filter((x) => x.id !== it.id))
    setBusy(null)
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Lock className="w-4 h-4 text-zinc-400" /> Unlocks</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Gate a download or secret track. Leave the price at $0 for a Spotify-follow unlock (you get their verified email), or set a price to sell it (needs payments set up).</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">
          <Plus className="w-4 h-4" />New unlock
        </button>
      </div>

      {open && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — e.g. Free stems download"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short teaser (optional)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <input value={rewardUrl} onChange={(e) => setRewardUrl(e.target.value)} placeholder="Reward link (revealed after unlock) — Dropbox, Drive, etc."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">$</span>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00 = free (Spotify follow)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center gap-3">
            {coverUrl ? <img src={coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-zinc-700" /> : <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700" />}
            <label className="px-3 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors cursor-pointer flex items-center gap-2">
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Cover
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
            </label>
            <button onClick={create} disabled={busy === 'new' || !title || !rewardUrl}
              className="ml-auto px-5 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
              {busy === 'new' && <Loader2 className="w-4 h-4 animate-spin" />}Add
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-white truncate font-medium">{it.title}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{it.price_cents > 0 ? `$${(it.price_cents / 100).toFixed(2)}` : 'Free'}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${it.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>{it.is_active ? 'Live' : 'Off'}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggle(it)} disabled={busy === it.id} className="px-2.5 py-1 border border-zinc-700 text-zinc-300 rounded-md text-xs hover:border-zinc-500 disabled:opacity-50 transition-colors">
                  {busy === it.id ? <Loader2 className="w-3 h-3 animate-spin" /> : it.is_active ? 'Pause' : 'Resume'}
                </button>
                <button onClick={() => remove(it)} disabled={busy === it.id} className="p-1 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
