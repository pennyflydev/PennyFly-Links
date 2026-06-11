'use client'

import { useEffect, useState } from 'react'
import { User, Globe, Bell, Plug, ShieldCheck, Loader2, Check, X } from 'lucide-react'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: ShieldCheck },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  // Profile state
  const [loading, setLoading] = useState(true)
  const [artistName, setArtistName] = useState('')
  const [bio, setBio] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [genreInput, setGenreInput] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/artist')
      .then((r) => r.json())
      .then(({ artist }) => {
        if (artist) {
          setArtistName(artist.artist_name ?? '')
          setBio(artist.bio ?? '')
          setGenres(artist.genres ?? [])
          setSubdomain(artist.subdomain ?? '')
          setSlug(artist.slug ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function addGenre(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && genreInput.trim()) {
      e.preventDefault()
      if (!genres.includes(genreInput.trim())) setGenres([...genres, genreInput.trim()])
      setGenreInput('')
    }
  }

  async function saveProfile() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/artist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist_name: artistName, bio, genres }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Could not save')
      }
    } catch {
      setError('Could not save')
    }
    setSaving(false)
  }

  async function saveSubdomain() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/artist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Could not save subdomain (it may be taken)')
      }
    } catch {
      setError('Could not save subdomain')
    }
    setSaving(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      <div className="flex gap-8">
        {/* Tab nav */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 max-w-xl">
          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-white">Artist Info</h2>
                {loading ? (
                  <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Artist Name</label>
                      <input
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Bio</label>
                      <textarea
                        rows={4}
                        maxLength={300}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
                      />
                      <p className="text-xs text-zinc-600 mt-1">{bio.length}/300 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Genres</label>
                      {genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {genres.map((g) => (
                            <span key={g} className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-xs text-zinc-300">
                              {g}
                              <button onClick={() => setGenres(genres.filter((x) => x !== g))} className="text-zinc-500 hover:text-white">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <input
                        value={genreInput}
                        onChange={(e) => setGenreInput(e.target.value)}
                        onKeyDown={addGenre}
                        placeholder="Type and press Enter…"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'domains' && (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-1">Your Page URL</h2>
                <p className="text-xs text-zinc-500 mb-4">Your public FlyLink page lives here.</p>
                <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-zinc-700 mb-4">
                  <span className="px-3 py-2.5 bg-zinc-700 text-zinc-400 text-sm border-r border-zinc-600">pennyfly.com/</span>
                  <input
                    value={subdomain || slug}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="flex-1 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:outline-none"
                    placeholder="your-name"
                  />
                </div>
                <button
                  onClick={saveSubdomain}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save URL'}
                </button>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-white">Custom Domains</h2>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs font-medium">Coming soon</span>
                </div>
                <p className="text-sm text-zinc-500">Connect your own domain (e.g. music.yourname.com). Available on Pro and above.</p>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              {[
                { name: 'AWeber', description: 'Auto-sync fan emails to your AWeber list', badge: 'Priority' },
                { name: 'Mailchimp', description: 'Auto-sync fan emails to your Mailchimp audience', badge: null },
                { name: 'Klaviyo', description: 'Auto-sync fan emails to your Klaviyo list', badge: null },
                { name: 'Meta Pixel', description: 'Track conversions from Facebook & Instagram ads', badge: null },
                { name: 'TikTok Pixel', description: 'Track conversions from TikTok ads', badge: null },
                { name: 'Google Analytics', description: 'Get detailed visitor insights', badge: null },
              ].map(({ name, description, badge }) => (
                <div key={name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{name}</span>
                      {badge && <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded text-xs font-medium">{badge}</span>}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                  </div>
                  <button className="px-4 py-1.5 border border-zinc-700 text-zinc-400 rounded-lg text-xs font-medium cursor-default">
                    Coming soon
                  </button>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'notifications' || activeTab === 'account') && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400 text-sm">Coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
