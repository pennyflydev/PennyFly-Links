import Stripe from 'stripe'

// Lazily construct so the app still builds/runs before keys are added.
let _stripe: Stripe | null = null
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  return _stripe
}

export function isBillingConfigured() {
  return !!process.env.STRIPE_SECRET_KEY
}

export type PlanId = 'starter' | 'pro' | 'label'
export type Interval = 'monthly' | 'yearly'

// Plan definitions. Price IDs come from env (fill after creating products in Stripe).
export const PLANS: Record<PlanId, {
  name: string
  priceIds: Record<Interval, string | undefined>
  limits: { links: number; artistSeats: number }
}> = {
  starter: {
    name: 'Starter',
    priceIds: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
    },
    limits: { links: 3, artistSeats: 1 },
  },
  pro: {
    name: 'Pro',
    priceIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    limits: { links: Infinity, artistSeats: 1 },
  },
  label: {
    name: 'Label',
    priceIds: {
      monthly: process.env.STRIPE_LABEL_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_LABEL_YEARLY_PRICE_ID,
    },
    limits: { links: Infinity, artistSeats: 10 },
  },
}

// Resolve the effective limits for a stored plan value.
// 'signed' (label-covered) and 'enterprise' get unlimited.
export function limitsForPlan(plan: string): { links: number; artistSeats: number } {
  if (plan === 'signed' || plan === 'enterprise') return { links: Infinity, artistSeats: Infinity }
  if (plan in PLANS) return PLANS[plan as PlanId].limits
  return PLANS.starter.limits
}

export function priceId(plan: PlanId, interval: Interval): string | undefined {
  return PLANS[plan]?.priceIds[interval]
}

// Map a Stripe price ID back to our plan id (for webhook handling).
export function planForPriceId(id: string | undefined): PlanId | null {
  if (!id) return null
  for (const key of Object.keys(PLANS) as PlanId[]) {
    const p = PLANS[key]
    if (p.priceIds.monthly === id || p.priceIds.yearly === id) return key
  }
  return null
}
