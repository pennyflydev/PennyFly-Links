'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check } from 'lucide-react'

const RELEASE_TYPES = ['single', 'album', 'ep']
const PLATFORMS = ['spotify', 'apple_music', 'youtube_music', 'tidal', 'amazon_music', 'deezer', 'bandcamp', 'soundcloud']
const PLATFORM_LABELS: Record<string, string> = {
  spotify: 'Spotify', apple_music: 'Apple Music', youtube_music: 'YouTube Music',
  tidal: 'Tidal', amazon_music: 'Amazon Music', deezer: 'Deezer',
  bandcamp: 'Bandcamp', soundcloud: 'SoundCloud',
}

export default function EditLinkPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [artistName, setArtistName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [releaseType, setReleaseType] = useState('single')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [streamingLinks, setStreamingLinks] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/links/${id}`)
      .then((r) => r.json())
      .then(({ link }) => {
        if (link) {
          setTitle(link.title ?? '')
          setArtistName(link.artist_name ?? '')
          setSubtitle(link.subtitle ?? '')
          setReleaseType(link.release_type ?? 'single')
          setCoverUrl(link.cover_url ?? null)
          setIsPublished(link.is_published ?? false)
          const map: Record<string, string> = {}
          for (const sl of link.streaming_links ?? []) map[sl.platform] = sl.url
          setStreamingLinks(map)
        } else {
          setError('Link not found')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleCoverUpload(file: File) {
    setUploadingCover(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', 'release')
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
      const res = await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          artist_name: artistName,
          subtitle,
          release_type: releaseType,
          cover_url: coverUrl,
          is_published: isPublished,
          streamingLinks: Object.entries(streamingLinks).map(([platform, url]) => ({ platform, url })),
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => router.push('/dashboard/links'), 700)
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
      <Link href="/dashboard/links" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />All Links
      </Link>
      <h1 className="text-2xl font-bold text-white mb-8">Edit FlyLink</h1>

      {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cover */}
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
            <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Artist Name</label>
            <input value={artistName} onChange={(e) => setArtistName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Subtitle</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Out Now, New Single, etc."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Release Type</label>
            <div className="grid grid-cols-3 gap-2">
              {RELEASE_TYPES.map((t) => (
                <button key={t} onClick={() => setReleaseType(t)}
                  className={`py-2.5 rounded-lg text-sm font-medium border capitalize transition-colors ${releaseType === t ? 'bg-yellow-400 text-black border-yellow-400' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Streaming Links</label>
            <div className="space-y-2">
              {PLATFORMS.map((platform) => (
                <div key={platform} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
                  <span className="text-sm font-medium text-white w-28 shrink-0">{PLATFORM_LABELS[platform]}</span>
                  <input
                    value={streamingLinks[platform] ?? ''}
                    onChange={(e) => setStreamingLinks((prev) => ({ ...prev, [platform]: e.target.value }))}
                    placeholder="Paste URL…"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Published</p>
              <p className="text-xs text-zinc-500">Live and publicly visible</p>
            </div>
            <button onClick={() => setIsPublished(!isPublished)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${isPublished ? 'bg-yellow-400 justify-end' : 'bg-zinc-700 justify-start'}`}>
              <span className="w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/links" className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">Cancel</Link>
            <button onClick={save} disabled={!title || saving}
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
