'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import { slugify } from '@/lib/utils'

const STEPS = ['Basic Info', 'Add Links', 'Design', 'Preview']
const RELEASE_TYPES = ['Single', 'Album', 'EP']

const PLATFORMS = [
  'spotify', 'apple_music', 'youtube_music', 'tidal',
  'amazon_music', 'deezer', 'bandcamp', 'soundcloud',
]
const PLATFORM_LABELS: Record<string, string> = {
  spotify: 'Spotify', apple_music: 'Apple Music', youtube_music: 'YouTube Music',
  tidal: 'Tidal', amazon_music: 'Amazon Music', deezer: 'Deezer',
  bandcamp: 'Bandcamp', soundcloud: 'SoundCloud',
}

export default function CreateLinkPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [autoFillLoading, setAutoFillLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoFillUrl, setAutoFillUrl] = useState('')
  const [title, setTitle] = useState('')
  const [artistName, setArtistName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [releaseType, setReleaseType] = useState('Single')
  const [slug, setSlug] = useState('')
  const [streamingLinks, setStreamingLinks] = useState<Record<string, string>>({})
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  async function handleAutoFill() {
    if (!autoFillUrl) return
    setAutoFillLoading(true)
    try {
      const res = await fetch(`/api/odesli?url=${encodeURIComponent(autoFillUrl)}`)
      const data = await res.json()
      if (data.title) { setTitle(data.title); setSlug(slugify(data.title)) }
      if (data.artistName) setArtistName(data.artistName)
      if (data.thumbnailUrl) setCoverUrl(data.thumbnailUrl)
      if (data.links) {
        const map: Record<string, string> = {}
        for (const { platform, url } of data.links) map[platform] = url
        setStreamingLinks(map)
      }
    } catch {}
    setAutoFillLoading(false)
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', 'release')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) setCoverUrl(data.url)
    } catch {}
    setUploadingCover(false)
  }

  async function handlePublish(publish: boolean) {
    setSaving(true)
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          artistName,
          subtitle,
          releaseType: releaseType.toLowerCase(),
          slug,
          publish,
          coverUrl,
          streamingLinks: Object.entries(streamingLinks).map(([platform, url]) => ({ platform, url })),
        }),
      })
      if (res.ok) router.push('/dashboard/links')
    } catch {}
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/links" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />All Links
      </Link>
      <h1 className="text-2xl font-bold text-white mb-8">Create FlyLink</h1>

      {/* Steps */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i === step ? 'bg-yellow-400 text-black' : i < step ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${i === step ? 'text-yellow-400' : 'text-zinc-500'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-16 mx-1 mb-4 ${i < step ? 'bg-green-500' : 'bg-zinc-800'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Song / Release URL</label>
            <div className="flex gap-2">
              <input value={autoFillUrl} onChange={(e) => setAutoFillUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
              <button onClick={handleAutoFill} disabled={autoFillLoading || !autoFillUrl}
                className="px-4 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
                {autoFillLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Auto-fill
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">Paste any streaming link to auto-fill all platforms</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Title *</label>
            <input value={title} onChange={(e) => { setTitle(e.target.value); setSlug(slugify(e.target.value)) }}
              placeholder="Song or release title"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Artist Name</label>
            <input value={artistName} onChange={(e) => setArtistName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
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
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${releaseType === t ? 'bg-yellow-400 text-black border-yellow-400' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Custom URL Slug</label>
            <div className="flex rounded-lg overflow-hidden border border-zinc-800">
              <span className="px-3 py-2.5 bg-zinc-800 text-zinc-400 text-sm border-r border-zinc-700">pennyfly.com/</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-release"
                className="flex-1 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none" />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button onClick={() => setStep(1)} disabled={!title}
              className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400 mb-4">Edit or toggle which platforms to include. Auto-filled platforms are pre-checked.</p>
          {PLATFORMS.map((platform) => (
            <div key={platform} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{PLATFORM_LABELS[platform]}</p>
              </div>
              <input
                value={streamingLinks[platform] ?? ''}
                onChange={(e) => setStreamingLinks((prev) => ({ ...prev, [platform]: e.target.value }))}
                placeholder="Paste URL..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          ))}
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(0)} className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">← Back</button>
            <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">Next →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Cover Art</label>
            <div className="flex items-center gap-4">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="w-24 h-24 rounded-xl object-cover border border-zinc-700" />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs text-center px-2">
                  No cover yet
                </div>
              )}
              <label className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors cursor-pointer flex items-center gap-2">
                {uploadingCover && <Loader2 className="w-4 h-4 animate-spin" />}
                {coverUrl ? 'Replace' : 'Upload'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              </label>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Auto-filled from your streaming link when available. Upload to override.</p>
          </div>
          <p className="text-zinc-500 text-xs">Page colors use your Artist Page theme — update it in the Artist Page editor.</p>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">← Back</button>
            <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-zinc-800 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">{title}</p>
              <p className="text-xs text-zinc-400">{artistName} · {releaseType}</p>
              <p className="text-xs text-zinc-500">pennyfly.com/{slug}</p>
              <p className="text-xs text-zinc-500">{Object.values(streamingLinks).filter(Boolean).length} platforms linked</p>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors">← Back</button>
            <div className="flex items-center gap-3">
              <button onClick={() => handlePublish(false)} disabled={saving}
                className="px-5 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors">
                Save Draft
              </button>
              <button onClick={() => handlePublish(true)} disabled={saving}
                className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Publish Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
