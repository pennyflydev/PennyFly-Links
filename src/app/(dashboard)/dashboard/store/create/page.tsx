'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function CreateProductPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [buyUrl, setBuyUrl] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCover(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file); form.append('kind', 'product')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) setCoverUrl(data.url); else setError(data.error ?? 'Upload failed')
    } catch { setError('Upload failed') }
    setUploading(false)
  }

  async function submit(publish: boolean) {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, buyUrl, coverUrl,
          priceCents: Math.round((parseFloat(price) || 0) * 100),
          publish,
        }),
      })
      if (res.ok) router.push('/dashboard/store')
      else { const d = await res.json(); setError(d.error ?? 'Something went wrong'); setSaving(false) }
    } catch { setError('Something went wrong'); setSaving(false) }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/store" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </Link>
      <h1 className="text-2xl font-bold text-white mb-8">Add Product</h1>
      {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Cover Image</label>
          <div className="flex items-center gap-4">
            {coverUrl ? <img src={coverUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-zinc-800" /> : <div className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs">None</div>}
            <label className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors cursor-pointer flex items-center gap-2">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}Upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])} />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midnight Beat Pack"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Price (USD)</label>
          <div className="flex rounded-lg overflow-hidden border border-zinc-800 w-40">
            <span className="px-3 py-2.5 bg-zinc-800 text-zinc-400 text-sm border-r border-zinc-700">$</span>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
              className="flex-1 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Buy link</label>
          <input value={buyUrl} onChange={(e) => setBuyUrl(e.target.value)} placeholder="https://gumroad.com/... or BeatStars / Bandcamp"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
          <p className="text-xs text-zinc-500 mt-1.5">Where the &quot;Buy&quot; button sends fans. Native in-page checkout is coming with billing.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 resize-none" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={() => submit(false)} disabled={!title || saving}
            className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors">Save Draft</button>
          <button onClick={() => submit(true)} disabled={!title || saving}
            className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}Publish
          </button>
        </div>
      </div>
    </div>
  )
}
