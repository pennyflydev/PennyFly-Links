'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { slugify } from '@/lib/utils'

export default function CreatePresavePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [artistName, setArtistName] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [description, setDescription] = useState('')
  const [showCounter, setShowCounter] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/presave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, artistName, spotifyUrl, releaseDate, description, showCounter }),
      })
      if (res.ok) {
        router.push('/dashboard/pre-save')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
      }
    } catch {
      setError('Something went wrong')
    }
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/pre-save" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </Link>
      <h1 className="text-2xl font-bold text-white mb-8">Create Pre-save Campaign</h1>

      {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Release Title *</label>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setSlug(slugify(e.target.value)) }}
            placeholder="e.g. My New Album"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Link Slug</label>
          <div className="flex rounded-lg overflow-hidden border border-zinc-800">
            <span className="px-3 py-2.5 bg-zinc-800 text-zinc-400 text-sm border-r border-zinc-700">pennyfly.com/pre-save/</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-new-album"
              className="flex-1 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Artist Name</label>
          <input value={artistName} onChange={(e) => setArtistName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Release Date *</label>
          <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Spotify Album / Track URL</label>
          <input value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/album/..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
          <p className="text-xs text-zinc-500 mt-1.5">Optional — add later if not available yet.</p>
        </div>
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Show fan counter</p>
            <p className="text-xs text-zinc-500">Display how many fans are pre-saving</p>
          </div>
          <button onClick={() => setShowCounter(!showCounter)}
            className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${showCounter ? 'bg-yellow-400' : 'bg-zinc-700'}`}>
            <span className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${showCounter ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell fans about this release..." rows={4}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard/pre-save" className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">Cancel</Link>
          <button onClick={handleSubmit} disabled={!title || !releaseDate || saving}
            className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  )
}
