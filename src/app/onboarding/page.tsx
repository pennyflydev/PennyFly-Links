'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Music2, User, Radio, Loader2, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [choice, setChoice] = useState<'artist' | 'label' | null>(null)
  const [labelName, setLabelName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(type: 'artist' | 'label') {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, labelName }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(data.redirect ?? '/dashboard/overview')
        router.refresh()
      } else {
        setError(data.error ?? 'Something went wrong')
        setBusy(false)
      }
    } catch {
      setError('Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Music2 className="w-6 h-6 text-yellow-400" />
          <span className="text-lg font-bold tracking-tight">FlyLink</span>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Welcome! How will you use FlyLink?</h1>
        <p className="text-zinc-400 text-center mb-10">You can always contact us to change this later.</p>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setChoice('artist')}
            className={`p-6 rounded-2xl border text-left transition-colors ${
              choice === 'artist' ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-4">
              <User className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="font-semibold mb-1">I&apos;m an artist</h2>
            <p className="text-sm text-zinc-400">Build my smart links, pre-saves, and fan list.</p>
          </button>

          <button
            onClick={() => setChoice('label')}
            className={`p-6 rounded-2xl border text-left transition-colors ${
              choice === 'label' ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-4">
              <Radio className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="font-semibold mb-1">I&apos;m a label or manager</h2>
            <p className="text-sm text-zinc-400">Manage a roster of artists from one dashboard.</p>
          </button>
        </div>

        {choice === 'label' && (
          <div className="mt-6">
            <label className="block text-sm text-zinc-400 mb-1.5">Label / company name</label>
            <input
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="e.g. Pennyfly Records"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
        )}

        <button
          onClick={() => choice && submit(choice)}
          disabled={!choice || busy || (choice === 'label' && !labelName.trim())}
          className="mt-8 w-full flex items-center justify-center gap-2 py-3 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  )
}
