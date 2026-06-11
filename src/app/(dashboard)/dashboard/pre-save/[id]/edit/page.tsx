'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check } from 'lucide-react'

export default function EditPresavePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [artistName, setArtistName] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [description, setDescription] = useState('')
  const [showCounter, setShowCounter] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  useEffect(() => {
    fetch(`/api/presave/${id}`)
      .then((r) => r.json())
      .then(({ campaign }) => {
        if (campaign) {
          setTitle(campaign.title ?? '')
          setArtistName(campaign.artist_name ?? '')
          setSpotifyUrl(campaign.spotify_url ?? '')
          setReleaseDate(campaign.release_date ?? '')
          setDescription(campaign.description ?? '')
          setShowCounter(campaign.show_fan_count ?? true)
          setIsActive(campaign.is_active ?? true)
          setCoverUrl(campaign.cover_url ?? null)
        } else {
          setError('Campaign not found')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleCoverUpload(file: File) {
    setUploadingCover(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', 'presave')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) setCoverUrl(data.url)
      else setError(data.error ?? 'Upload failed')
    } catch {
      setError('Upload failed')
    }
    setUploadingCover(false)
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/presave/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          release_date: releaseDate,
          spotify_url: spotifyUrl || null,
          description,
          show_fan_count: showCounter,
          is_active: isActive,
          cover_url: coverUrl,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => router.push('/dashboard/pre-save'), 700)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Could not save')
        setSaving(false)
      }
    } catch {
      setError('Could not save')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/pre-save" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back
      </Link>
      <h1 className="text-2xl font-bold text-white mb-8">Edit Pre-save Campaign</h1>

      {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Cover Art</label>
            <div className="flex items-center gap-4">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-zinc-800" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs">None</div>
              )}
              <label className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors cursor-pointer flex items-center gap-2">
                {uploadingCover && <Loader2 className="w-4 h-4 animate-spin" />}
                {coverUrl ? 'Replace' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Release Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Release Date</label>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Spotify Album / Track URL</label>
            <input value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)} placeholder="https://open.spotify.com/album/..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none" />
          </div>

          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Show fan counter</p>
              <p className="text-xs text-zinc-500">Display how many fans are pre-saving</p>
            </div>
            <button onClick={() => setShowCounter(!showCounter)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${showCounter ? 'bg-yellow-400 justify-end' : 'bg-zinc-700 justify-start'}`}>
              <span className="w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </div>
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Active</p>
              <p className="text-xs text-zinc-500">Visible on your page and accepting pre-saves</p>
            </div>
            <button onClick={() => setIsActive(!isActive)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${isActive ? 'bg-yellow-400 justify-end' : 'bg-zinc-700 justify-start'}`}>
              <span className="w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/pre-save" className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">Cancel</Link>
            <button onClick={save} disabled={!title || !releaseDate || saving}
              className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving && !saved && <Loader2 className="w-4 h-4 animate-spin" />}
              {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
