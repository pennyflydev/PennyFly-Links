'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check, ChevronUp, ChevronDown, Music2, X } from 'lucide-react'

type Section = { section: string; is_visible: boolean; sort_order: number }

const SECTION_LABELS: Record<string, string> = {
  bio: 'Bio',
  flylinks: 'FlyLinks',
  presave: 'Pre-Save',
  custom_links: 'Custom Links',
  email_capture: 'Email Capture',
}

const THEMES = [
  { id: 'minimal', name: 'Minimal', colors: ['#3f3f46', '#52525b', '#71717a'], bg: '#09090b' },
  { id: 'bold', name: 'Bold', colors: ['#f59e0b', '#f97316', '#eab308'], bg: 'linear-gradient(160deg,#1c1917,#451a03)' },
  { id: 'elegant', name: 'Elegant', colors: ['#8b5cf6', '#7c3aed', '#6d28d9'], bg: 'linear-gradient(160deg,#1e1b2e,#2e1065)' },
  { id: 'neon', name: 'Neon', colors: ['#22c55e', '#16a34a', '#15803d'], bg: 'linear-gradient(160deg,#0c1f17,#052e16)' },
]

export default function ArtistPageEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [artistName, setArtistName] = useState('')
  const [bio, setBio] = useState('')
  const [theme, setTheme] = useState('minimal')
  const [bgValue, setBgValue] = useState('#09090b')
  const [font, setFont] = useState('sans')
  const [buttonStyle, setButtonStyle] = useState('rounded')
  const [slug, setSlug] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([])
  const [customLinks, setCustomLinks] = useState<{ label: string; url: string }[]>([])
  const [playlists, setPlaylists] = useState<{ title: string; spotify_url: string }[]>([])
  const [mediaEmbeds, setMediaEmbeds] = useState<{ url: string }[]>([])
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [hideBranding, setHideBranding] = useState(false)
  const [shopifyDomain, setShopifyDomain] = useState('')
  const [shopifyToken, setShopifyToken] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/artist').then((r) => r.json()),
      fetch('/api/sections').then((r) => r.json()),
      fetch('/api/social-links').then((r) => r.json()),
      fetch('/api/custom-links').then((r) => r.json()),
      fetch('/api/playlists').then((r) => r.json()),
      fetch('/api/media-embeds').then((r) => r.json()),
    ])
      .then(([{ artist }, { sections }, social, custom, playlistData, mediaData]) => {
        if (artist) {
          setArtistName(artist.artist_name ?? '')
          setBio(artist.bio ?? '')
          setTheme(artist.theme ?? 'minimal')
          setBgValue(artist.background_value || '#09090b')
          setFont(artist.font ?? 'sans')
          setButtonStyle(artist.button_style ?? 'rounded')
          setSlug(artist.slug ?? '')
          setAvatarUrl(artist.avatar_url ?? null)
          setCoverUrl(artist.cover_url ?? null)
          setSeoTitle(artist.seo_title ?? '')
          setSeoDescription(artist.seo_description ?? '')
          setHideBranding(artist.hide_branding ?? false)
          setShopifyDomain(artist.shopify_domain ?? '')
          setShopifyToken(artist.shopify_token ?? '')
        }
        const loaded: Section[] = sections?.length
          ? sections
          : Object.keys(SECTION_LABELS).map((s, i) => ({ section: s, is_visible: true, sort_order: i }))
        setSections([...loaded].sort((a, b) => a.sort_order - b.sort_order))
        setSocialLinks(social.links ?? [])
        setCustomLinks(custom.links ?? [])
        setPlaylists(playlistData.playlists ?? [])
        setMediaEmbeds(mediaData.embeds ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  async function importFromSpotify() {
    if (!importUrl.trim()) return
    setImporting(true)
    setImportMsg('')
    try {
      const res = await fetch(`/api/import/spotify?url=${encodeURIComponent(importUrl)}`)
      const data = await res.json()
      if (res.ok) {
        if (data.name) setArtistName(data.name)
        if (data.image) setAvatarUrl(data.image)
        const n = data.releases?.length ?? 0
        setImportMsg(`Imported ${data.name}${n ? ` · ${n} releases found` : ''}. Review and hit Save.`)
      } else {
        setImportMsg(data.error ?? 'Could not import')
      }
    } catch {
      setImportMsg('Could not import')
    }
    setImporting(false)
  }

  async function uploadImage(kind: 'avatar' | 'cover', file: File) {
    setUploading(kind)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', kind)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        if (kind === 'avatar') setAvatarUrl(data.url)
        else setCoverUrl(data.url)
      } else {
        setError(data.error ?? 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    }
    setUploading(null)
  }

  function toggleSection(name: string) {
    setSections((prev) => prev.map((s) => (s.section === name ? { ...s, is_visible: !s.is_visible } : s)))
  }

  function move(index: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((s, i) => ({ ...s, sort_order: i }))
    })
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const [a, s, soc, cust, pl, me] = await Promise.all([
        fetch('/api/artist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artist_name: artistName, bio, theme, avatar_url: avatarUrl, cover_url: coverUrl,
            background_type: bgValue.includes('gradient') ? 'gradient' : 'color',
            background_value: bgValue,
            seo_title: seoTitle, seo_description: seoDescription, hide_branding: hideBranding,
            font, button_style: buttonStyle,
            shopify_domain: shopifyDomain.trim() || null, shopify_token: shopifyToken.trim() || null,
          }),
        }),
        fetch('/api/sections', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: sections.map((x, i) => ({ ...x, sort_order: i })) }),
        }),
        fetch('/api/social-links', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ links: socialLinks }),
        }),
        fetch('/api/custom-links', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ links: customLinks }),
        }),
        fetch('/api/playlists', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlists }),
        }),
        fetch('/api/media-embeds', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: mediaEmbeds }),
        }),
      ])
      if (a.ok && s.ok && soc.ok && cust.ok && pl.ok && me.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError('Could not save changes')
      }
    } catch {
      setError('Could not save changes')
    }
    setSaving(false)
  }


  return (
    <div className="flex h-full">
      {/* Editor panel */}
      <div className="w-[380px] border-r border-zinc-800 overflow-y-auto bg-zinc-900/50">
        <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save'}
          </button>
          {slug && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors"
            >
              View Live
            </a>
          )}
        </div>

        {error && <p className="m-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm p-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Import from Spotify */}
            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4">
              <p className="text-sm font-medium text-white mb-1">Import from Spotify</p>
              <p className="text-xs text-zinc-500 mb-3">Paste your Spotify artist link to auto-fill your name &amp; photo.</p>
              <div className="flex gap-2">
                <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="open.spotify.com/artist/…"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                <button onClick={importFromSpotify} disabled={importing || !importUrl.trim()}
                  className="px-3 py-2 bg-yellow-400 text-black rounded-lg text-xs font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Import
                </button>
              </div>
              {importMsg && <p className="text-xs text-yellow-400/90 mt-2">{importMsg}</p>}
            </div>

            {/* Images */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Profile Photo</label>
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-zinc-700" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <Music2 className="w-6 h-6 text-zinc-600" />
                    </div>
                  )}
                  <label className="px-3 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors cursor-pointer flex items-center gap-2">
                    {uploading === 'avatar' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Upload
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadImage('avatar', e.target.files[0])} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Cover Image</label>
                <div className="flex items-center gap-3">
                  {coverUrl ? (
                    <img src={coverUrl} alt="" className="w-24 h-12 rounded-lg object-cover border border-zinc-700" />
                  ) : (
                    <div className="w-24 h-12 rounded-lg bg-zinc-800 border border-zinc-700" />
                  )}
                  <label className="px-3 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium hover:border-zinc-500 transition-colors cursor-pointer flex items-center gap-2">
                    {uploading === 'cover' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Upload
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadImage('cover', e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>

            {/* Artist name + bio */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Artist Name</label>
                <input
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
            </div>

            {/* Section order */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Section Order</span>
                <span className="text-xs text-zinc-500">Reorder & toggle</span>
              </div>
              <div className="border-t border-zinc-800 divide-y divide-zinc-800">
                {sections.map((s, i) => (
                  <div key={s.section} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button onClick={() => move(i, -1)} disabled={i === 0} className="text-zinc-600 hover:text-white disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="text-zinc-600 hover:text-white disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm text-zinc-300">{SECTION_LABELS[s.section] ?? s.section}</span>
                    </div>
                    <button
                      onClick={() => toggleSection(s.section)}
                      className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${s.is_visible ? 'bg-yellow-400 justify-end' : 'bg-zinc-700 justify-start'}`}
                    >
                      <span className="w-4 h-4 bg-white rounded-full shadow" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme & background */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3">
                <span className="text-sm font-medium text-white">Theme &amp; background</span>
              </div>
              <div className="border-t border-zinc-800 p-3 grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setBgValue(t.bg) }}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      t.id === theme ? 'border-yellow-400 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="w-full h-8 rounded-md mb-2 border border-white/10" style={{ background: t.bg }} />
                    <span className="text-xs font-medium text-zinc-300">{t.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-zinc-800 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Custom colour</span>
                  <input
                    type="color"
                    value={bgValue.includes('gradient') ? '#09090b' : bgValue}
                    onChange={(e) => setBgValue(e.target.value)}
                    className="w-9 h-7 rounded bg-transparent border border-zinc-700 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-xs font-medium text-zinc-400">Gradients</span>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {[
                      'linear-gradient(160deg,#0f172a,#020617)',
                      'linear-gradient(160deg,#3b0764,#1e1b4b)',
                      'linear-gradient(160deg,#450a0a,#1c1917)',
                      'linear-gradient(160deg,#052e16,#022c22)',
                      'linear-gradient(160deg,#0c4a6e,#082f49)',
                      'linear-gradient(160deg,#4a044e,#500724)',
                      'linear-gradient(160deg,#292524,#0c0a09)',
                      'linear-gradient(160deg,#1e3a8a,#172554)',
                    ].map((g) => (
                      <button key={g} onClick={() => setBgValue(g)}
                        className={`h-8 rounded-md border transition-colors ${bgValue === g ? 'border-yellow-400' : 'border-white/10 hover:border-white/30'}`}
                        style={{ background: g }} />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-zinc-400">Font</span>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {[
                      { id: 'sans', label: 'Sans', ff: 'system-ui' },
                      { id: 'serif', label: 'Serif', ff: 'Georgia, serif' },
                      { id: 'mono', label: 'Mono', ff: 'ui-monospace, monospace' },
                      { id: 'rounded', label: 'Round', ff: 'ui-rounded, system-ui' },
                    ].map((f) => (
                      <button key={f.id} onClick={() => setFont(f.id)}
                        className={`py-1.5 rounded-md border text-xs transition-colors ${font === f.id ? 'border-yellow-400 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                        style={{ fontFamily: f.ff }}>Aa</button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-zinc-400">Button style</span>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {[
                      { id: 'rounded', label: 'Rounded', cls: 'rounded-lg' },
                      { id: 'pill', label: 'Pill', cls: 'rounded-full' },
                      { id: 'square', label: 'Square', cls: 'rounded-none' },
                    ].map((b) => (
                      <button key={b.id} onClick={() => setButtonStyle(b.id)}
                        className={`py-1.5 border text-xs transition-colors ${b.cls} ${buttonStyle === b.id ? 'border-yellow-400 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Social Links</span>
                <button
                  onClick={() => setSocialLinks([...socialLinks, { platform: '', url: '' }])}
                  className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  + Add
                </button>
              </div>
              {socialLinks.length > 0 && (
                <div className="border-t border-zinc-800 p-3 space-y-2">
                  {socialLinks.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={l.platform}
                        onChange={(e) => setSocialLinks(socialLinks.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)))}
                        placeholder="instagram"
                        className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <input
                        value={l.url}
                        onChange={(e) => setSocialLinks(socialLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                        placeholder="https://…"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <button onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Links */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Custom Links</span>
                <button
                  onClick={() => setCustomLinks([...customLinks, { label: '', url: '' }])}
                  className="text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  + Add
                </button>
              </div>
              {customLinks.length > 0 && (
                <div className="border-t border-zinc-800 p-3 space-y-2">
                  {customLinks.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={l.label}
                        onChange={(e) => setCustomLinks(customLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                        placeholder="Merch"
                        className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <input
                        value={l.url}
                        onChange={(e) => setCustomLinks(customLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                        placeholder="https://…"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <button onClick={() => setCustomLinks(customLinks.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Playlist Spotlight */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Playlist Spotlight</span>
                <button onClick={() => setPlaylists([...playlists, { title: '', spotify_url: '' }])} className="text-xs text-yellow-400 hover:text-yellow-300 font-medium">+ Add</button>
              </div>
              {playlists.length > 0 && (
                <div className="border-t border-zinc-800 p-3 space-y-2">
                  {playlists.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={p.title} onChange={(e) => setPlaylists(playlists.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Playlist name"
                        className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                      <input value={p.spotify_url} onChange={(e) => setPlaylists(playlists.map((x, j) => (j === i ? { ...x, spotify_url: e.target.value } : x)))} placeholder="open.spotify.com/playlist/…"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                      <button onClick={() => setPlaylists(playlists.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Media players */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Media Players</span>
                <button onClick={() => setMediaEmbeds([...mediaEmbeds, { url: '' }])} className="text-xs text-yellow-400 hover:text-yellow-300 font-medium">+ Add</button>
              </div>
              {mediaEmbeds.length > 0 && (
                <div className="border-t border-zinc-800 p-3 space-y-2">
                  {mediaEmbeds.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={m.url} onChange={(e) => setMediaEmbeds(mediaEmbeds.map((x, j) => (j === i ? { url: e.target.value } : x)))} placeholder="Spotify / YouTube / Apple / SoundCloud link"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                      <button onClick={() => setMediaEmbeds(mediaEmbeds.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-zinc-800 px-4 py-2">
                <p className="text-xs text-zinc-600">Paste a track, album, playlist, or video link — it embeds a live player.</p>
              </div>
            </div>

            {/* SEO & Branding */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3">
                <span className="text-sm font-medium text-white">SEO &amp; Branding</span>
              </div>
              <div className="border-t border-zinc-800 p-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Page title <span className="text-zinc-600">(search &amp; social)</span></label>
                  <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={`${artistName || 'Artist'} | FlyLink`}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Meta description</label>
                  <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} placeholder="Shown in Google results and link previews"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-medium text-white">Hide &quot;Powered by FlyLink&quot;</p>
                    <p className="text-[11px] text-zinc-600">Available on Pro and above</p>
                  </div>
                  <button onClick={() => setHideBranding(!hideBranding)}
                    className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${hideBranding ? 'bg-yellow-400 justify-end' : 'bg-zinc-700 justify-start'}`}>
                    <span className="w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
              </div>
            </div>

            {/* Connect Shopify (merch) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Merch · Shopify</span>
                {shopifyDomain && shopifyToken && <span className="text-xs text-green-400">Connected</span>}
              </div>
              <div className="border-t border-zinc-800 p-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Store domain</label>
                  <input value={shopifyDomain} onChange={(e) => setShopifyDomain(e.target.value)} placeholder="your-store.myshopify.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Storefront access token</label>
                  <input value={shopifyToken} onChange={(e) => setShopifyToken(e.target.value)} placeholder="Storefront API token"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  In Shopify admin → Settings → Apps → Develop apps → create an app → enable the <b>Storefront API</b> (read products) → copy the Storefront access token. Your merch then appears on your page automatically. Printful items sync through Shopify too.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live preview */}
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-start p-8 overflow-y-auto">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-6 font-medium">Live Preview</p>
        <div
          className="w-[390px] min-h-[844px] rounded-[40px] border border-zinc-700 overflow-hidden shadow-2xl flex flex-col items-center pt-16 pb-8 px-6 text-white"
          style={{ background: bgValue }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-white/20 mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 mb-4 flex items-center justify-center">
              <Music2 className="w-10 h-10 text-white/40" />
            </div>
          )}
          <p className="text-xl font-bold mb-1">{artistName || 'Your Artist Name'}</p>
          <p className="text-sm text-white/60 mb-6 text-center">{bio || 'Add a bio to tell visitors about yourself'}</p>
          <div className="w-full space-y-2">
            {sections.filter((s) => s.is_visible && s.section !== 'bio').map((s) => (
              <div key={s.section} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white/70">
                {SECTION_LABELS[s.section]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
