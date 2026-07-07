'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ShieldOff, Loader2 } from 'lucide-react'

export default function RoleControl({ profileId, role }: { profileId: string; role: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const isAdmin = role === 'admin'

  async function setRole(next: 'admin' | 'artist') {
    if (next === 'admin' && !confirm('Grant full admin access to this account?')) return
    setBusy(true)
    const res = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, role: next }),
    })
    if (res.ok) router.refresh()
    setBusy(false)
  }

  return (
    <button
      onClick={() => setRole(isAdmin ? 'artist' : 'admin')}
      disabled={busy}
      title={isAdmin ? 'Remove admin access' : 'Make admin'}
      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium disabled:opacity-50 transition-colors ${
        isAdmin
          ? 'border-yellow-400/40 text-yellow-400 hover:border-yellow-400'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
      }`}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isAdmin ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
      {isAdmin ? 'Admin' : 'Make admin'}
    </button>
  )
}
