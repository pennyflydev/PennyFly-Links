'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Loader2 } from 'lucide-react'

export default function ActAsButton({ artistId }: { artistId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function act() {
    setBusy(true)
    const res = await fetch('/api/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistId }),
    })
    if (res.ok) {
      router.push('/dashboard/overview')
      router.refresh()
    } else {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={act}
      disabled={busy}
      title="Act as this artist"
      className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-yellow-400 hover:text-yellow-400 disabled:opacity-50 transition-colors"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
      Act as
    </button>
  )
}
