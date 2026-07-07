'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ShoppingBag, Trash2, Loader2, Music2 } from 'lucide-react'

export type Product = {
  id: string
  title: string
  price_cents: number
  cover_url: string | null
  buy_url: string | null
  is_published: boolean
}

function money(cents: number) {
  return cents > 0 ? `$${(cents / 100).toFixed(2)}` : 'Free'
}

export default function StoreListClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [busy, setBusy] = useState<string | null>(null)

  async function togglePublish(p: Product) {
    setBusy(p.id)
    const res = await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !p.is_published }),
    })
    if (res.ok) setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_published: !x.is_published } : x)))
    setBusy(null)
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.title}"?`)) return
    setBusy(p.id)
    const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
    if (res.ok) setProducts((prev) => prev.filter((x) => x.id !== p.id))
    setBusy(null)
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
          <ShoppingBag className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No products yet</h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm">Sell beats, stems, sample packs, merch, or downloads right from your page.</p>
        <Link href="/dashboard/store/create" className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />Add Your First Product
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((p) => (
        <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
          <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
            {p.cover_url ? <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" /> : <Music2 className="w-5 h-5 text-zinc-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-white truncate">{p.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_published ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                {p.is_published ? 'Live' : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{money(p.price_cents)}{p.buy_url ? '' : ' · no buy link yet'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dashboard/store/${p.id}/edit`} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">Edit</Link>
            <button onClick={() => togglePublish(p)} disabled={busy === p.id}
              className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors min-w-[78px]">
              {busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : p.is_published ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => remove(p)} disabled={busy === p.id} title="Delete" className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
