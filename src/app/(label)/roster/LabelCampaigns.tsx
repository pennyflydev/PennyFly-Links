'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Trash2, Loader2 } from 'lucide-react'

type Campaign = { id: string; title: string; message: string; url: string | null; cover_url: string | null; is_active: boolean }

export default function LabelCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/label/campaigns').then((r) => r.json()).then((d) => setCampaigns(d.campaigns ?? [])).finally(() => setLoading(false))
  }, [])

  async function uploadCover(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append('file', file); form.append('kind', 'campaign')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok) setCoverUrl(data.url)
    setUploading(false)
  }

  async function create() {
    setBusy('new')
    const res = await fetch('/api/label/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, url, coverUrl }),
    })
    const data = await res.json()
    if (res.ok) {
      setCampaigns((p) => [data.campaign, ...p])
      setTitle(''); setMessage(''); setUrl(''); setCoverUrl(null); setOpen(false)
    }
    setBusy(null)
  }

  async function toggle(c: Campaign) {
    setBusy(c.id)
    const res = await fetch(`/api/label/campaigns/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !c.is_active }),
    })
    if (res.ok) setCampaigns((p) => p.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)))
    setBusy(null)
  }

  async function remove(c: Campaign) {
    if (!confirm(`Delete campaign "${c.title}"?`)) return
    setBusy(c.id)
    const res = await fetch(`/api/label/campaigns/${c.id}`, { method: 'DELETE' })
    if (res.ok) setCampaigns((p) => p.filter((x) => x.id !== c.id))
    setBusy(null)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-zinc-400" /> Campaigns</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Promote a release or tour across every artist&apos;s page.</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">+ New campaign</button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — e.g. Label Compilation Vol. 3"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Short message (optional)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link (https://…)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <div className="flex items-center gap-3">
            {coverUrl ? <img src={coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-zinc-700" /> : <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700" />}
            <label className="px-3 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors cursor-pointer flex items-center gap-2">
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Cover
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
            </label>
            <button onClick={create} disabled={busy === 'new' || !title}
              className="ml-auto px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
              {busy === 'new' && <Loader2 className="w-4 h-4 animate-spin" />}Launch
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm mt-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : campaigns.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800 pt-4 space-y-2">
          {campaigns.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white truncate">{c.title}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>{c.is_active ? 'Live' : 'Off'}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggle(c)} disabled={busy === c.id} className="px-2.5 py-1 border border-zinc-700 text-zinc-300 rounded-md text-xs hover:border-zinc-500 disabled:opacity-50 transition-colors">
                  {busy === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : c.is_active ? 'Pause' : 'Resume'}
                </button>
                <button onClick={() => remove(c)} disabled={busy === c.id} className="p-1 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
