'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Music2, Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter',
    price: 9,
    description: 'For independent artists getting started.',
    features: [
      '3 FlyLinks',
      'Spotify pre-save + email capture',
      'Sell tickets, tips & store',
      'QR codes & media embeds',
      'Basic analytics',
      'pennyfly.com subdomain',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 19,
    description: 'For active artists who want the full toolkit.',
    features: [
      'Everything in Starter',
      'Unlimited FlyLinks',
      'Memberships & follow-to-unlock',
      'SMS & push drop alerts',
      'Superfan CRM + advanced analytics',
      'Spotify insights',
      'AWeber, Mailchimp & Klaviyo sync',
      '1 custom domain',
      'Meta, TikTok & Google Analytics pixels',
      'Remove FlyLink branding',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Label',
    price: 49,
    description: 'Manage your entire roster from one place.',
    features: [
      'Everything in Pro',
      'Up to 10 artist seats',
      'Label roster dashboard',
      'Aggregate analytics across artists',
      'Act as any artist + team roles',
      'Cross-roster campaigns & broadcasts',
      'Custom domains per artist',
      'Label white-label branding',
    ],
    highlighted: false,
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  // Annual billing = 2 months free (monthly × 10 / year). Shown as the
  // effective per-month price with the yearly total underneath.
  const perMonth = (monthly: number) => (annual ? (monthly * 10) / 12 : monthly)
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2))

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Music2 className="w-6 h-6 text-yellow-400" />
          <span className="text-lg font-bold tracking-tight">FlyLink</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/sign-up" className="px-4 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-lg hover:bg-yellow-300 transition-colors">
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="px-6 pt-20 pb-10 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
        <p className="text-lg text-zinc-400 mb-8">
          Start free for 7 days. No credit card required. Just a flat <span className="text-white font-medium">2.5%</span> fee
          on fan payments — you keep the rest.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!annual ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${annual ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            Annual
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${annual ? 'bg-black/15 text-black' : 'bg-yellow-400/15 text-yellow-400'}`}>2 months free</span>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col ${plan.highlighted ? 'bg-yellow-400 text-black' : 'bg-zinc-900 border border-zinc-800 text-white'}`}
            >
              <div className="mb-6">
                <h2 className={`text-base font-semibold mb-1 ${plan.highlighted ? 'text-black' : 'text-white'}`}>{plan.name}</h2>
                <p className={`text-xs mb-4 ${plan.highlighted ? 'text-black/70' : 'text-zinc-400'}`}>{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">${fmt(perMonth(plan.price))}</span>
                  <span className={`text-sm mb-1 ${plan.highlighted ? 'text-black/70' : 'text-zinc-400'}`}>/mo</span>
                </div>
                <p className={`text-xs mt-1 h-4 ${plan.highlighted ? 'text-black/60' : 'text-zinc-500'}`}>
                  {annual ? `billed $${plan.price * 10}/year` : ''}
                </p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlighted ? 'text-black' : 'text-yellow-400'}`} />
                    <span className={plan.highlighted ? 'text-black' : 'text-zinc-300'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/sign-up"
                className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${plan.highlighted ? 'bg-black text-white hover:bg-zinc-900' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Enterprise</h2>
            <p className="text-sm text-zinc-400">Large labels, distributors, or agencies with 10+ artists. Custom pricing, SLA, and onboarding.</p>
          </div>
          <a href="mailto:partnerships@pennyfly.com" className="shrink-0 px-6 py-2.5 border border-zinc-700 text-white text-sm font-semibold rounded-xl hover:border-zinc-500 transition-colors">
            Contact us
          </a>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-8">
          The 2.5% platform fee applies to fan payments (tickets, tips, store, memberships). Money settles to your own
          account — FlyLink never holds your funds.
        </p>
        <p className="text-center text-sm text-zinc-600 mt-3">
          Signed to Pennyfly Records? You get Pro free. <a href="mailto:info@pennyfly.com" className="text-yellow-400 hover:underline">Contact us.</a>
        </p>
      </section>
    </div>
  )
}
