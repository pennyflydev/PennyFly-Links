'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Loader2 } from 'lucide-react'

export default function ImpersonationBanner({ artistName }: { artistName: string }) {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  async function exit() {
    setExiting(true)
    await fetch('/api/impersonate', { method: 'DELETE' })
    router.push('/roster')
    router.refresh()
  }

  return (
    <div className="bg-yellow-400 text-black px-4 py-2 flex items-center justify-between text-sm font-medium shrink-0">
      <span className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        Viewing as <strong>{artistName}</strong> — changes you make apply to their account
      </span>
      <button
        onClick={exit}
        disabled={exiting}
        className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-md text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors"
      >
        {exiting && <Loader2 className="w-3 h-3 animate-spin" />}
        Exit
      </button>
    </div>
  )
}
