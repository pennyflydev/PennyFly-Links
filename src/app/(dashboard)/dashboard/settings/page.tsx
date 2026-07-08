'use client'

import { useEffect, useState } from 'react'
import { User, Globe, Bell, Plug, ShieldCheck, CreditCard, Loader2, Check, X } from 'lucide-react'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: ShieldCheck },
]

const BILLING_PLANS = [
  { id: 'starter', name: 'Starter', monthly: 9, blurb: '3 FlyLinks, pre-saves, analytics' },
  { id: 'pro', name: 'Pro', monthly: 19, blurb: 'Unlimited links, integrations, custom domain' },
  { id: 'label', name: 'Label', monthly: 49, blurb: 'Up to 10 artists, roster dashboard' },
] as const

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
  const [metaPixel, setMetaPixel] = useState('')
  const [tiktokPixel, setTiktokPixel] = useState('')
  const [gaId, setGaId] = useState('')
  const [walletEnabled, setWalletEnabled] = useState(false)
  const [walletBusy, setWalletBusy] = useState(false)
  const [plan, setPlan] = useState('starter')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [billingBusy, setBillingBusy] = useState(false)
  const [billingMsg, setBillingMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('billing')
    if (q === 'success') { setActiveTab('billing'); setBillingMsg('Subscription updated — thank you!') }
    if (q === 'cancelled') { setActiveTab('billing'); setBillingMsg('Checkout cancelled.') }
  }, [])

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
          setMetaPixel(artist.meta_pixel_id ?? '')
          setTiktokPixel(artist.tiktok_pixel_id ?? '')
          setGaId(artist.ga_measurement_id ?? '')
          setWalletEnabled(!!artist.wallet_pass_enabled)
          setPlan(artist.profiles?.plan ?? 'starter')
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

  async function savePixels() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/artist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_pixel_id: metaPixel.trim() || null,
          tiktok_pixel_id: tiktokPixel.trim() || null,
          ga_measurement_id: gaId.trim() || null,
        }),
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

  async function toggleWallet(next: boolean) {
    setWalletBusy(true)
    setError('')
    setWalletEnabled(next)
    try {
      const res = await fetch('/api/artist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_pass_enabled: next }),
      })
      if (!res.ok) {
        setWalletEnabled(!next)
        const data = await res.json()
        setError(data.error ?? 'Could not update')
      }
    } catch {
      setWalletEnabled(!next)
      setError('Could not update')
    }
    setWalletBusy(false)
  }

  async function startCheckout(planId: string) {
    setBillingBusy(true)
    setError('')
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, interval: billingInterval }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? 'Could not start checkout')
    } catch {
      setError('Could not start checkout')
    }
    setBillingBusy(false)
  }

  async function openPortal() {
    setBillingBusy(true)
    setError('')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? 'Could not open billing portal')
    } catch {
      setError('Could not open billing portal')
    }
    setBillingBusy(false)
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

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {billingMsg && (
                <p className="text-sm bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 rounded-lg px-4 py-3">{billingMsg}</p>
              )}

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Current plan</p>
                  <p className="text-xl font-bold text-white capitalize">{plan}</p>
                </div>
                {plan === 'signed' ? (
                  <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-xs font-medium">Covered by your label</span>
                ) : (
                  <button onClick={openPortal} disabled={billingBusy}
                    className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {billingBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    Manage subscription
                  </button>
                )}
              </div>

              {plan !== 'signed' && (
                <>
                  <div className="flex items-center justify-center gap-2">
                    {(['monthly', 'yearly'] as const).map((iv) => (
                      <button key={iv} onClick={() => setBillingInterval(iv)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${billingInterval === iv ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
                        {iv === 'monthly' ? 'Monthly' : 'Yearly'}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4">
                    {BILLING_PLANS.map((p) => {
                      const isCurrent = plan === p.id
                      const price = billingInterval === 'yearly' ? Math.round(p.monthly * 10) : p.monthly
                      return (
                        <div key={p.id} className={`rounded-xl border p-5 flex items-center justify-between ${isCurrent ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 bg-zinc-900'}`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{p.name}</span>
                              <span className="text-zinc-500 text-sm">${price}/{billingInterval === 'yearly' ? 'yr' : 'mo'}</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">{p.blurb}</p>
                          </div>
                          {isCurrent ? (
                            <span className="px-3 py-1.5 text-xs font-medium text-yellow-400">Current</span>
                          ) : (
                            <button onClick={() => startCheckout(p.id)} disabled={billingBusy}
                              className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
                              {billingBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                              Choose {p.name}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-zinc-600 text-center">Secure checkout via Stripe. Cancel anytime.</p>
                </>
              )}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Tracking pixels — live */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Tracking Pixels</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Fire a PageView on your public pages to build retargeting audiences.</p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Meta Pixel ID</label>
                  <input value={metaPixel} onChange={(e) => setMetaPixel(e.target.value)} placeholder="e.g. 1234567890"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">TikTok Pixel ID</label>
                  <input value={tiktokPixel} onChange={(e) => setTiktokPixel(e.target.value)} placeholder="e.g. CABC1234..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Google Analytics ID</label>
                  <input value={gaId} onChange={(e) => setGaId(e.target.value)} placeholder="e.g. G-XXXXXXXXXX"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500" />
                </div>
                <button onClick={savePixels} disabled={saving}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Pixels'}
                </button>
              </div>

              {/* Wallet pass */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h2 className="text-base font-semibold text-white">Wallet Pass</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Show a “Save to Wallet” button on your page so fans keep you one tap away. Google Wallet
                      activates once the platform keys are set; Apple Wallet needs an Apple Developer certificate.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleWallet(!walletEnabled)}
                    disabled={walletBusy}
                    role="switch"
                    aria-checked={walletEnabled}
                    className={`relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50 ${walletEnabled ? 'bg-yellow-400' : 'bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${walletEnabled ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Email integrations — coming soon */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email Integrations</p>
                {[
                  { name: 'AWeber', description: 'Auto-sync fan emails to your AWeber list', badge: 'Priority' },
                  { name: 'Mailchimp', description: 'Auto-sync fan emails to your Mailchimp audience', badge: null },
                  { name: 'Klaviyo', description: 'Auto-sync fan emails to your Klaviyo list', badge: null },
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
