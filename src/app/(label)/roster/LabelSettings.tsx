'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'

export default function LabelSettings({
  initial,
}: {
  initial: { name: string; logo_url: string | null; accent_color: string | null }
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initial.name ?? '')
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logo_url ?? null)
  const [accent, setAccent] = useState(initial.accent_color ?? '#facc15')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function uploadLogo(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('kind', 'label-logo')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok) setLogoUrl(data.url)
    setUploading(false)
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/label', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, logo_url: logoUrl, accent_color: accent }),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-base font-semibold text-white">Label branding</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Your name &amp; logo show on your artists&apos; pages instead of FlyLink.</p>
        </div>
        <span className="text-zinc-500 text-sm">{open ? '−' : 'Edit'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-zinc-800 pt-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Label name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Logo</label>
            <div className="flex items-center gap-3">
              {logoUrl ? <img src={logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-zinc-700" /> : <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700" />}
              <label className="px-3 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors cursor-pointer flex items-center gap-2">
                {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-400">Accent colour</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-7 rounded bg-transparent border border-zinc-700 cursor-pointer" />
          </div>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save branding'}
          </button>
        </div>
      )}
    </div>
  )
}
