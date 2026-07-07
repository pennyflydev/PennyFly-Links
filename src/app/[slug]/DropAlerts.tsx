'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export default function DropAlerts({ slug }: { slug: string }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error' | 'unsupported'>('idle')

  async function subscribe() {
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapid || typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    setStatus('working')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('error'); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, subscription: sub.toJSON() }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'unsupported') return null

  return (
    <button
      onClick={subscribe}
      disabled={status === 'working' || status === 'done'}
      className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors disabled:opacity-70"
    >
      {status === 'done' ? (
        <><Check className="w-3.5 h-3.5 text-green-400" /> Drop alerts on</>
      ) : (
        <><Bell className="w-3.5 h-3.5" /> {status === 'error' ? 'Try again' : 'Get drop alerts'}</>
      )}
    </button>
  )
}
