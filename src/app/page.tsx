import Link from 'next/link'
import { Music2, Link2, Mail, BarChart3, Zap, Globe, Users, Star } from 'lucide-react'

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
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-yellow-400 text-xs font-medium mb-8">
          <Star className="w-3 h-3" />
          The smart link platform built for artists
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
          One link for
          <br />
          <span className="text-yellow-400">all your music</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Share your releases everywhere, capture fan emails automatically, and track every click.
          Built for independent artists and labels.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-8 py-3.5 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-colors text-base"
          >
            Start your free trial
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto px-8 py-3.5 border border-zinc-700 text-white font-semibold rounded-xl hover:border-zinc-500 transition-colors text-base"
          >
            See pricing
          </Link>
        </div>
        <p className="text-sm text-zinc-600 mt-4">7-day free trial · No credit card required</p>
      </section>

      {/* Feature grid */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to grow your fanbase</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            From streaming links to pre-saves to email capture — all in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Link2,
              title: 'Smart streaming links',
              desc: 'Paste one URL and we auto-fill Spotify, Apple Music, YouTube Music, Tidal, and more.',
            },
            {
              icon: Mail,
              title: 'Fan email capture',
              desc: 'Collect emails from pre-saves and gates. Auto-sync to AWeber, Mailchimp, or Klaviyo.',
            },
            {
              icon: Zap,
              title: 'Spotify Pre-Save',
              desc: 'Let fans save upcoming releases before drop day and capture their email in the process.',
            },
            {
              icon: BarChart3,
              title: 'Link analytics',
              desc: 'See exactly which platforms your fans prefer, where clicks come from, and when.',
            },
            {
              icon: Globe,
              title: 'Custom domains',
              desc: 'Use your own domain instead of ours. Full CNAME setup with one-click DNS instructions.',
            },
            {
              icon: Users,
              title: 'Label roster management',
              desc: 'Pennyfly-powered. Manage every artist on your roster from a single label dashboard.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Up and running in minutes</h2>
        <p className="text-zinc-400 text-lg mb-16">No tech skills needed.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Paste your music URL', desc: 'Drop in any Spotify, Apple Music, or streaming link. We fill in the rest automatically.' },
            { step: '02', title: 'Customize your page', desc: 'Choose a theme, add your bio, photos, and social links. Make it yours.' },
            { step: '03', title: 'Share and grow', desc: 'Share one link everywhere. Watch your fan list grow with every click.' },
          ].map(({ step, title, desc }) => (
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

      {/* CTA banner */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to connect with your fans?</h2>
          <p className="text-zinc-400 mb-8 text-lg">Start your free 7-day trial. No credit card needed.</p>
          <Link
            href="/sign-up"
            className="inline-flex px-8 py-3.5 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-colors text-base"
          >
            Create your FlyLink
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-8 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold">FlyLink</span>
          <span className="text-zinc-600 text-sm ml-2">by Pennyfly</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <a href="mailto:support@pennyfly.com" className="hover:text-white transition-colors">Support</a>
        </div>
        <p className="text-xs text-zinc-700">© {new Date().getFullYear()} Pennyfly. All rights reserved.</p>
      </footer>
    </div>
  )
}
