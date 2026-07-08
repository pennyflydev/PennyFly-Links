'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Link2 } from 'lucide-react'

export default function SpotifyConnect({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    if (!url.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/spotify/artist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Could not connect')
      else router.refresh()
    } catch {
      setError('Could not connect — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={compact ? '' : 'max-w-md'}>
      <div className="flex items-center gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://open.spotify.com/artist/…"
          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
        />
        <button
          onClick={connect}
          disabled={busy || !url.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Connect
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
