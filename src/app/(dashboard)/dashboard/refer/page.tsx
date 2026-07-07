'use client'

import { useEffect, useState } from 'react'
import { Gift, Copy, Check, Loader2, Users } from 'lucide-react'

export default function ReferPage() {
  const [code, setCode] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/refer')
      .then((r) => r.json())
      .then((d) => { setCode(d.code ?? null); setCount(d.count ?? 0) })
      .finally(() => setLoading(false))
  }, [])

  const link = code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${code}` : ''

  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-5 h-5 text-yellow-400" />
        <h1 className="text-2xl font-bold text-white">Refer &amp; earn</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-8">Share FlyLink with other artists. Track everyone who joins through your link.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <label className="block text-sm text-zinc-400 mb-2">Your referral link</label>
            <div className="flex items-center gap-2">
              <input readOnly value={link} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none" />
              <button onClick={copy} className="px-4 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2">
                {copied ? <><Check className="w-4 h-4" />Copied</> : <><Copy className="w-4 h-4" />Copy</>}
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">{count}</p>
                <p className="text-sm text-zinc-400">{count === 1 ? 'artist joined' : 'artists joined'} through your link</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-600">Rewards for referrals are on the way — for now, every signup through your link is tracked here.</p>
        </div>
      )}
    </div>
  )
}
