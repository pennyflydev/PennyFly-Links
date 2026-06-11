'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Calendar, Copy, Trash2, Check, Loader2 } from 'lucide-react'

export type Campaign = {
  id: string
  title: string
  slug: string
  release_date: string
  save_count: number
  is_active: boolean
}

export default function PresaveListClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function toggleActive(c: Campaign) {
    setBusy(c.id)
    const res = await fetch(`/api/presave/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    })
    if (res.ok) setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x)))
    setBusy(null)
  }

  async function remove(c: Campaign) {
    if (!confirm(`Delete the "${c.title}" campaign? This can't be undone.`)) return
    setBusy(c.id)
    const res = await fetch(`/api/presave/${c.id}`, { method: 'DELETE' })
    if (res.ok) setCampaigns((prev) => prev.filter((x) => x.id !== c.id))
    setBusy(null)
  }

  function copyLink(c: Campaign) {
    navigator.clipboard.writeText(`${window.location.origin}/pre-save/${c.slug}`)
    setCopied(c.id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No pre-save campaigns yet</h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm">Create a pre-save campaign to capture fan emails and boost your release day streams.</p>
        <Link href="/dashboard/pre-save/create" className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />
          Create Your First Campaign
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-white">{c.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                {c.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Releases {new Date(c.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {c.save_count} pre-saves
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => copyLink(c)} title="Copy link" className="p-1.5 text-zinc-500 hover:text-white transition-colors">
              {copied === c.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <a href={`/pre-save/${c.slug}`} target="_blank" className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">
              View Page
            </a>
            <button
              onClick={() => toggleActive(c)}
              disabled={busy === c.id}
              className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors min-w-[80px]"
            >
              {busy === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : c.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => remove(c)} disabled={busy === c.id} title="Delete" className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
