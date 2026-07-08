'use client'

import { useState } from 'react'
import { Heart, Check } from 'lucide-react'

export default function FollowButton({
  artistId,
  signedIn,
  initialFollowing,
  initialCount,
  radiusClass = 'rounded-full',
}: {
  artistId: string
  signedIn: boolean
  initialFollowing: boolean
  initialCount: number
  radiusClass?: string
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    // Not signed in → send them to create a fan account first.
    if (!signedIn) {
      const here = typeof window !== 'undefined' ? window.location.pathname : '/'
      window.location.href = `/fans/sign-up?redirect_url=${encodeURIComponent(here)}`
      return
    }
    const next = !following
    setBusy(true)
    setFollowing(next)
    setCount((c) => c + (next ? 1 : -1))
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, follow: next }),
      })
      if (!res.ok) throw new Error('failed')
    } catch {
      setFollowing(!next)
      setCount((c) => c + (next ? -1 : 1))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={toggle}
        disabled={busy}
        className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold transition-colors ${radiusClass} disabled:opacity-60 ${
          following
            ? 'bg-white/15 text-white border border-white/25 hover:bg-white/20'
            : 'bg-white text-black hover:bg-white/90'
        }`}
      >
        {following ? (
          <>
            <Check className="w-4 h-4" /> Following
          </>
        ) : (
          <>
            <Heart className="w-4 h-4" /> Follow
          </>
        )}
      </button>
      {count > 0 && (
        <p className="text-xs text-white/50">
          {count.toLocaleString()} {count === 1 ? 'follower' : 'followers'}
        </p>
      )}
    </div>
  )
}
