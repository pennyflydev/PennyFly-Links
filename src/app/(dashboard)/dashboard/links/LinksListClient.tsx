'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ExternalLink, Eye, MousePointerClick, Copy, Trash2, Check, Loader2, Code2, Activity, AlertTriangle } from 'lucide-react'
import QrButton from '@/components/QrButton'
import UtmButton from '@/components/UtmButton'

export type PromoLink = {
  id: string
  title: string
  slug: string
  artist_name: string
  release_type: string
  is_published: boolean
  publish_at?: string | null
  expires_at?: string | null
  view_count: number
  click_count: number
  cover_url?: string | null
  streaming_links: { platform: string }[]
}

function statusOf(l: PromoLink) {
  if (!l.is_published) return { label: 'Draft', cls: 'bg-zinc-700 text-zinc-400' }
  const now = Date.now()
  if (l.publish_at && new Date(l.publish_at).getTime() > now) return { label: 'Scheduled', cls: 'bg-sky-500/20 text-sky-400' }
  if (l.expires_at && new Date(l.expires_at).getTime() <= now) return { label: 'Expired', cls: 'bg-zinc-700 text-zinc-500' }
  return { label: 'Live', cls: 'bg-green-500/20 text-green-400' }
}

export default function LinksListClient({
  initialLinks,
  artistSlug,
}: {
  initialLinks: PromoLink[]
  artistSlug: string | null
}) {
  const [links, setLinks] = useState(initialLinks)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [embedCopied, setEmbedCopied] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [broken, setBroken] = useState<Record<string, string[]>>({})
  const [healthMsg, setHealthMsg] = useState('')

  async function checkHealth() {
    setChecking(true)
    setHealthMsg('')
    try {
      const res = await fetch('/api/links/health')
      const data = await res.json()
      const map: Record<string, string[]> = {}
      for (const issue of data.issues ?? []) map[issue.id] = issue.broken
      setBroken(map)
      setHealthMsg(Object.keys(map).length === 0 ? 'All links are healthy ✓' : `${Object.keys(map).length} link(s) have broken URLs`)
    } catch {
      setHealthMsg('Could not check links')
    }
    setChecking(false)
  }

  const filtered = links.filter((l) => l.title.toLowerCase().includes(query.toLowerCase()))

  async function togglePublish(link: PromoLink) {
    setBusy(link.id)
    const res = await fetch(`/api/links/${link.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !link.is_published }),
    })
    if (res.ok) {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, is_published: !l.is_published } : l)))
    }
    setBusy(null)
  }

  async function remove(link: PromoLink) {
    if (!confirm(`Delete "${link.title}"? This can't be undone.`)) return
    setBusy(link.id)
    const res = await fetch(`/api/links/${link.id}`, { method: 'DELETE' })
    if (res.ok) setLinks((prev) => prev.filter((l) => l.id !== link.id))
    setBusy(null)
  }

  function copyLink(link: PromoLink) {
    const url = `${window.location.origin}/${artistSlug}/${link.slug}`
    navigator.clipboard.writeText(url)
    setCopied(link.id)
    setTimeout(() => setCopied(null), 2000)
  }

  function copyEmbed(link: PromoLink) {
    const src = `${window.location.origin}/embed/${artistSlug}/${link.slug}`
    const code = `<iframe src="${src}" width="400" height="480" style="border:0;border-radius:16px" loading="lazy"></iframe>`
    navigator.clipboard.writeText(code)
    setEmbedCopied(link.id)
    setTimeout(() => setEmbedCopied(null), 2000)
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-4">
          <Plus className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Your Music Deserves a Spotlight</h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm">Create smart links that bring all your streaming platforms together.</p>
        <Link href="/dashboard/links/create" className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" />
          Create Your First FlyLink
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search links..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <button onClick={checkHealth} disabled={checking}
          className="flex items-center gap-2 px-3 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors">
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          Check links
        </button>
        {healthMsg && <span className="text-xs text-zinc-400">{healthMsg}</span>}
      </div>

      <div className="space-y-3">
        {filtered.map((link) => (
          <div key={link.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-zinc-700 shrink-0 overflow-hidden">
              {link.cover_url && <img src={link.cover_url} alt={link.title} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-white truncate">{link.title}</p>
                {(() => { const s = statusOf(link); return (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                ) })()}
                {broken[link.id]?.length > 0 && (
                  <span title={`Broken: ${broken[link.id].join(', ')}`} className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/20 text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />{broken[link.id].length} broken
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">{link.artist_name} · {link.release_type} · {link.streaming_links?.length ?? 0} platforms</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500 shrink-0">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{link.view_count}</span>
              <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" />{link.click_count}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {link.is_published && artistSlug && (
                <>
                  <button onClick={() => copyLink(link)} title="Copy link" className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                    {copied === link.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <QrButton url={`/${artistSlug}/${link.slug}`} filename={`flylink-${link.slug}`} />
                  <UtmButton url={`/${artistSlug}/${link.slug}`} />
                  <button onClick={() => copyEmbed(link)} title="Copy embed code" className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                    {embedCopied === link.id ? <Check className="w-4 h-4 text-green-400" /> : <Code2 className="w-4 h-4" />}
                  </button>
                  <a href={`/${artistSlug}/${link.slug}`} target="_blank" title="Open" className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </>
              )}
              <Link href={`/dashboard/links/${link.id}/edit`} className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors">
                Edit
              </Link>
              <button
                onClick={() => togglePublish(link)}
                disabled={busy === link.id}
                className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors min-w-[78px]"
              >
                {busy === link.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : link.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => remove(link)} disabled={busy === link.id} title="Delete" className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
