import { getStripe } from './index'

// Platform fee on fan payments, in basis points (250 = 2.5%). Configurable.
export const PLATFORM_FEE_BPS = Number(process.env.STRIPE_PLATFORM_FEE_BPS ?? 250)

export function applicationFee(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000)
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_PROD_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// Create (once) an Express connected account for an artist, returning its id.
export async function createConnectAccount(email: string | null): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const account = await stripe.accounts.create({
    type: 'express',
    email: email ?? undefined,
    capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
    business_type: 'individual',
  })
  return account.id
}

// Hosted onboarding link (or a re-onboarding link if requirements are due).
export async function createOnboardingLink(accountId: string): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl()}/dashboard/payments?refresh=1`,
    return_url: `${appUrl()}/dashboard/payments?connected=1`,
    type: 'account_onboarding',
  })
  return link.url
}

// Express dashboard login link (for a fully-onboarded artist).
export async function createLoginLink(accountId: string): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null
  try {
    const link = await stripe.accounts.createLoginLink(accountId)
    return link.url
  } catch {
    return null
  }
}

// Current capability status for a connected account.
export async function getAccountStatus(accountId: string): Promise<{ chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean } | null> {
  const stripe = getStripe()
  if (!stripe) return null
  try {
    const a = await stripe.accounts.retrieve(accountId)
    return {
      chargesEnabled: !!a.charges_enabled,
      payoutsEnabled: !!a.payouts_enabled,
      detailsSubmitted: !!a.details_submitted,
    }
  } catch {
    return null
  }
}

// One-time destination charge: fan pays, funds settle to the artist's account
// minus our application fee. Returns a Checkout Session URL.
export async function createConnectCheckout(opts: {
  destinationAccountId: string
  amountCents: number
  productName: string
  imageUrl?: string | null
  metadata: Record<string, string>
  successUrl: string
  cancelUrl: string
}): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: opts.amountCents,
          product_data: { name: opts.productName, ...(opts.imageUrl ? { images: [opts.imageUrl] } : {}) },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFee(opts.amountCents),
      transfer_data: { destination: opts.destinationAccountId },
    },
    metadata: opts.metadata,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  })
  return session.url
}
