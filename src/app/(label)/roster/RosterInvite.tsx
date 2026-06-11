'use client'

import { useState } from 'react'
import { Plus, Loader2, Check, Mail } from 'lucide-react'

export type Invite = {
  id: string
  email: string
  token: string
  claimed_at: string | null
  expires_at: string
  created_at: string
}

export default function RosterInvite({ initialInvites }: { initialInvites: Invite[] }) {
  const [invites, setInvites] = useState(initialInvites.filter((i) => !i.claimed_at))
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  async function invite() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setInvites((prev) => [data.invite, ...prev])
        setEmail('')
        setOpen(false)
      } else {
        setError(data.error ?? 'Could not create invite')
      }
    } catch {
      setError('Could not create invite')
    }
    setBusy(false)
  }

  function copySignup(inv: Invite) {
    navigator.clipboard.writeText(`${window.location.origin}/sign-up`)
    setCopied(inv.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Invite Artists</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Invited artists become signed (free) accounts when they sign up with that email.</p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invite Artist
        </button>
      </div>

      {open && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="artist@email.com"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={invite}
            disabled={busy || !email}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Invite
          </button>
        </div>
      )}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      {invites.length > 0 && (
        <div className="mt-4 border-t border-zinc-800 pt-4 space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pending invites</p>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-zinc-300">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                {inv.email}
              </span>
              <button onClick={() => copySignup(inv)} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5">
                {copied === inv.id ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : 'Copy signup link'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
