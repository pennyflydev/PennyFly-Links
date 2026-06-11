import Link from 'next/link'
import { Music2, Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter',
    price: 9,
    description: 'Perfect for independent artists just getting started.',
    features: [
      '3 FlyLinks',
      'Spotify pre-save',
      'Basic analytics',
      'Email capture + CSV export',
      'pennyfly.com subdomain',
    ],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 19,
    description: 'For active artists who want full control.',
    features: [
      'Unlimited FlyLinks',
      'Spotify pre-save',
      'Advanced analytics',
      'Email capture + CSV export',
      'AWeber, Mailchimp & Klaviyo sync',
      '1 custom domain',
      'Meta & TikTok Pixel',
      'Google Analytics',
      'Priority support',
    ],
    cta: 'Start free trial',
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
      'Custom domains per artist',
      'Invite & manage signed artists',
    ],
    cta: 'Start free trial',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Music2 className="w-6 h-6 text-yellow-400" />
          <span className="text-lg font-bold tracking-tight">FlyLink</span>
        </Link>
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

      {/* Header */}
      <section className="px-6 pt-20 pb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-zinc-400">
          Start free for 7 days. No credit card required.
        </p>
      </section>

      {/* Plans */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col ${
                plan.highlighted
                  ? 'bg-yellow-400 text-black'
                  : 'bg-zinc-900 border border-zinc-800 text-white'
              }`}
            >
              <div className="mb-6">
                <h2 className={`text-base font-semibold mb-1 ${plan.highlighted ? 'text-black' : 'text-white'}`}>
                  {plan.name}
                </h2>
                <p className={`text-xs mb-4 ${plan.highlighted ? 'text-black/70' : 'text-zinc-400'}`}>
                  {plan.description}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlighted ? 'text-black/70' : 'text-zinc-400'}`}>/mo</span>
                </div>
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
                className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-black text-white hover:bg-zinc-900'
                    : 'bg-yellow-400 text-black hover:bg-yellow-300'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Enterprise</h2>
            <p className="text-sm text-zinc-400">
              Large labels, distributors, or agencies with 10+ artists. Custom pricing, SLA, and onboarding.
            </p>
          </div>
          <a
            href="mailto:partnerships@pennyfly.com"
            className="shrink-0 px-6 py-2.5 border border-zinc-700 text-white text-sm font-semibold rounded-xl hover:border-zinc-500 transition-colors"
          >
            Contact us
          </a>
        </div>

        {/* Pennyfly signed artists note */}
        <p className="text-center text-sm text-zinc-600 mt-8">
          Signed to Pennyfly Records? You get Pro free. <a href="mailto:info@pennyfly.com" className="text-yellow-400 hover:underline">Contact us.</a>
        </p>
      </section>
    </div>
  )
}
