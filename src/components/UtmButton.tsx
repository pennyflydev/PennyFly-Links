'use client'

import { useState } from 'react'
import { Tag, X, Copy, Check } from 'lucide-react'

const SOURCES = ['instagram', 'tiktok', 'twitter', 'youtube', 'facebook', 'newsletter', 'discord']
const MEDIUMS = ['social', 'bio', 'email', 'paid', 'story']

export default function UtmButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState('')
  const [medium, setMedium] = useState('social')
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)

  const base = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const params = new URLSearchParams()
  if (source) params.set('utm_source', source)
  if (medium) params.set('utm_medium', medium)
  if (campaign.trim()) params.set('utm_campaign', campaign.trim().replace(/\s+/g, '_').toLowerCase())
  const tagged = params.toString() ? `${base}?${params.toString()}` : base

  function copy() {
    navigator.clipboard.writeText(tagged)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} title="UTM tracking link" className="p-1.5 text-zinc-500 hover:text-white transition-colors">
        <Tag className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">UTM tracking link</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Source (where you&apos;re sharing)</label>
                <input list="utm-sources" value={source} onChange={(e) => setSource(e.target.value)} placeholder="instagram"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
                <datalist id="utm-sources">{SOURCES.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Medium</label>
                <input list="utm-mediums" value={medium} onChange={(e) => setMedium(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500" />
                <datalist id="utm-mediums">{MEDIUMS.map((m) => <option key={m} value={m} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Campaign (optional)</label>
                <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="summer_drop"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
              </div>
            </div>

            <div className="mt-4 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5">
              <p className="text-xs text-zinc-400 break-all">{tagged}</p>
            </div>
            <button onClick={copy}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
              {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy tracked link</>}
            </button>
            <p className="text-xs text-zinc-600 mt-2 text-center">Shows up in Google Analytics under Traffic → Source / Medium.</p>
          </div>
        </div>
      )}
    </>
  )
}
