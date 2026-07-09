import Link from 'next/link'
import {
  Music2, Link2, Ticket, Heart, ShoppingBag, Star, Mail, MessageSquare,
  Bell, BarChart3, Globe, Users, Zap, QrCode, Wallet, Check, ArrowRight,
  Share2, DollarSign, Calendar, TrendingUp, Sparkles,
} from 'lucide-react'

const PILLARS = [
  {
    key: 'share',
    icon: Share2,
    title: 'Share',
    tagline: 'One page for everywhere you live online.',
    features: [
      { icon: Link2, title: 'Smart streaming links', desc: 'Paste one URL — we auto-fill Spotify, Apple Music, YouTube Music, Tidal, Amazon and more via Odesli.' },
      { icon: Zap, title: 'Spotify pre-saves', desc: 'Fans save the drop before release day and connect Spotify — capturing their verified email, no forms.' },
      { icon: Music2, title: 'A page that’s yours', desc: 'Themes, fonts, custom backgrounds, media players, playlist spotlights, social icons and a fan wall.' },
      { icon: QrCode, title: 'QR codes & embeds', desc: 'Download a QR for any link or page, and embed players anywhere.' },
      { icon: Globe, title: 'Custom domains', desc: 'Use your own domain instead of ours — full DNS setup included.' },
      { icon: Calendar, title: 'Event pages', desc: 'Gig and launch pages with live countdowns — auto-imported from Bandsintown.' },
    ],
  },
  {
    key: 'monetize',
    icon: DollarSign,
    title: 'Monetize',
    tagline: 'Every way to get paid — and you keep 97.5%.',
    features: [
      { icon: Ticket, title: 'Ticketing', desc: 'Sell QR tickets, add Google/Apple Wallet passes, and scan fans in at the door — single-scan, first-scan-wins.' },
      { icon: Heart, title: 'Tip jar', desc: 'Let fans send a one-off tip straight from your page. Funds land in your account, minus 2.5%.' },
      { icon: ShoppingBag, title: 'Digital store', desc: 'Sell beats, stems, downloads and merch with native checkout — or connect your Shopify catalog.' },
      { icon: Star, title: 'Memberships', desc: 'Recurring fan memberships with perks — your own Patreon, on your page.' },
      { icon: Sparkles, title: 'Follow-to-unlock', desc: 'Gate exclusive content behind a Spotify follow or a small payment.' },
      { icon: Wallet, title: 'You own the payouts', desc: 'Powered by Stripe — money settles to your own account. FlyLink never holds your funds.' },
    ],
  },
  {
    key: 'grow',
    icon: TrendingUp,
    title: 'Grow',
    tagline: 'Turn listeners into a fanbase you own.',
    features: [
      { icon: Mail, title: 'Email capture', desc: 'Collect verified fan emails from pre-saves and gates — export any time.' },
      { icon: MessageSquare, title: 'SMS drop alerts', desc: 'Text is the highest-engagement channel in music. Collect opt-ins and blast a drop the moment it’s live.' },
      { icon: Bell, title: 'Push notifications', desc: 'Web-push drop alerts fans opt into in one tap — no app needed.' },
      { icon: Users, title: 'Superfan CRM', desc: 'See who your biggest supporters are, tag superfans, and track where every fan came from.' },
      { icon: BarChart3, title: 'Deep analytics', desc: 'Clicks, views, CTR, geography, device, platform preference, pre-save conversion — plus public Spotify insights.' },
      { icon: Share2, title: 'Referrals & fan accounts', desc: 'Reward fans for sharing, and let them follow you for a feed of your drops and shows.' },
    ],
  },
]

const STEPS = [
  { step: '01', title: 'Paste your music URL', desc: 'Drop in any streaming link. We build your smart link and fill in every platform automatically.' },
  { step: '02', title: 'Add your tools', desc: 'Turn on tickets, tips, a store, memberships and drop alerts — as much or as little as you want.' },
  { step: '03', title: 'Share one link, get paid', desc: 'Put your FlyLink everywhere. Grow a fanbase you own, and keep 97.5% of what you earn.' },
]

const FAQ = [
  { q: 'How is this different from Linktree?', a: 'FlyLink is built for the music business, not just links. You get pre-saves with verified email capture, ticketing, a store, memberships and a full label layer — and you keep 97.5% of sales versus the 88–91% typical of general link-in-bio tools.' },
  { q: 'What fee do you take on sales?', a: 'A flat 2.5% platform fee on fan payments (tickets, tips, store, memberships). Money settles directly to your own Stripe account — we never hold your funds.' },
  { q: 'Do I need a Stripe account to start?', a: 'No. Setup is a hosted flow that creates your payout account for you — no pre-existing Stripe account required. You can share links and capture fans before you ever turn on payments.' },
  { q: 'I’m signed to a label. Can they manage my page?', a: 'Yes. Labels get a roster dashboard, aggregate analytics, team roles and the ability to act on any artist’s behalf. Signed artists get their plan free.' },
  { q: 'Can I use my own domain?', a: 'Yes — bring your own domain on Pro and Label plans, with guided DNS setup.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Music2 className="w-6 h-6 text-yellow-400" />
          <span className="text-lg font-bold tracking-tight">FlyLink</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#for-labels" className="hover:text-white transition-colors">For labels</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/sign-up" className="px-4 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-lg hover:bg-yellow-300 transition-colors">
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-16 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-yellow-400 text-xs font-medium mb-6">
            <Star className="w-3 h-3" />
            The all-in-one platform for artists & labels
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
            Share your music.
            <br />
            Sell tickets. <span className="text-yellow-400">Get paid.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            One page for your links, pre-saves, tickets, tips, store and memberships — with the fan emails and analytics
            to grow. Keep <span className="text-white font-medium">97.5%</span> of what you earn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href="/sign-up" className="w-full sm:w-auto px-8 py-3.5 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-colors text-base inline-flex items-center justify-center gap-2">
              Start your free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto px-8 py-3.5 border border-zinc-700 text-white font-semibold rounded-xl hover:border-zinc-500 transition-colors text-base text-center">
              See pricing
            </Link>
          </div>
          <p className="text-sm text-zinc-600 mt-4">7-day free trial · No credit card required</p>
        </div>

        {/* Product mockup */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-[280px] rounded-[2.5rem] border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-yellow-400/5">
            <div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-zinc-900 to-black border border-zinc-800">
              <div className="h-20 bg-gradient-to-br from-yellow-400/30 to-purple-500/20" />
              <div className="px-5 -mt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-4 border-zinc-950 flex items-center justify-center">
                  <Music2 className="w-7 h-7 text-yellow-400" />
                </div>
                <p className="mt-3 font-bold">Nova Vale</p>
                <p className="text-xs text-zinc-500">New single out now</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 bg-white text-black rounded-lg px-3 py-2 text-xs font-semibold">
                    <Music2 className="w-3.5 h-3.5" /> Listen everywhere
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs font-medium">
                    <Ticket className="w-3.5 h-3.5 text-yellow-400" /> Get tickets — Fri
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs font-medium">
                    <Heart className="w-3.5 h-3.5 text-yellow-400" /> Support Nova
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs font-medium">
                    <ShoppingBag className="w-3.5 h-3.5 text-yellow-400" /> Store
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Anti-Linktree strip */}
      <section className="px-6 py-8 border-y border-zinc-900 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-yellow-400">2.5%</p>
            <p className="text-xs text-zinc-500 mt-1">platform fee — not 9–12%</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">1 page</p>
            <p className="text-xs text-zinc-500 mt-1">links, sales & fans in one</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">100%</p>
            <p className="text-xs text-zinc-500 mt-1">your fan list, your payouts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">Label-ready</p>
            <p className="text-xs text-zinc-500 mt-1">full roster & team tools</p>
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need, in one link</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">Share your music, get paid for it, and grow a fanbase you actually own.</p>
        </div>
        <div className="space-y-16">
          {PILLARS.map((pillar) => (
            <div key={pillar.key}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center">
                  <pillar.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{pillar.title}</h3>
                  <p className="text-sm text-zinc-500">{pillar.tagline}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pillar.features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                    <Icon className="w-5 h-5 text-yellow-400 mb-3" />
                    <h4 className="text-base font-semibold text-white mb-1.5">{title}</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For labels */}
      <section id="for-labels" className="px-6 py-20">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-10 md:p-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-zinc-800 rounded-full text-zinc-300 text-xs font-medium mb-6">
            <Users className="w-3 h-3 text-yellow-400" /> Built by a label, for labels
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 max-w-2xl">Run your whole roster from one dashboard</h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-2xl">
            FlyLink was built by Pennyfly Records to manage its own artists — so the label layer is a first-class product,
            not an afterthought.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Roster dashboard with aggregate analytics across every artist',
              'Invite signed artists — they get their plan free',
              'Act as any artist to edit their page and campaigns',
              'Team roles: owners, managers and viewers',
              'Cross-roster campaigns and fan broadcasts',
              'White-label the roster with your own branding',
            ].map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" /> {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Up and running in minutes</h2>
        <p className="text-zinc-400 text-lg mb-16">No tech skills needed.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 font-mono text-sm font-bold mb-4">
                {step}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Questions, answered</h2>
        <div className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-2">{q}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto bg-yellow-400 text-black rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to grow your fanbase?</h2>
          <p className="text-black/70 mb-8 text-lg">Start your free 7-day trial. No credit card needed.</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-zinc-900 transition-colors text-base">
            Create your FlyLink <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="px-6 py-12 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Music2 className="w-5 h-5 text-yellow-400" />
              <span className="text-base font-bold">FlyLink</span>
            </div>
            <p className="text-sm text-zinc-500">Share your music, sell tickets, and get paid — all from one page.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Product</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><a href="#for-labels" className="hover:text-white transition-colors">For labels</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Company</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="mailto:info@pennyfly.com" className="hover:text-white transition-colors">About Pennyfly</a></li>
              <li><a href="mailto:support@pennyfly.com" className="hover:text-white transition-colors">Support</a></li>
              <li><a href="mailto:partnerships@pennyfly.com" className="hover:text-white transition-colors">Partnerships</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Get started</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/sign-up" className="hover:text-white transition-colors">Start free trial</Link></li>
              <li><Link href="/sign-in" className="hover:text-white transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-900 px-6 py-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Pennyfly. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-zinc-600">
            <span>FlyLink by Pennyfly Records</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
