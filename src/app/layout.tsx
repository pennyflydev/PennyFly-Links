import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_PROD_URL || 'https://penny-fly-links.vercel.app'
const tagline = 'Share your music, sell tickets, and get paid — all from one page.'
const description =
  'FlyLink is the all-in-one page for artists and labels: smart streaming links, Spotify pre-saves, ticketing, tips, a store, memberships, and fan CRM — keep 97.5% of what you earn. Built by Pennyfly.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FlyLink — one page to share your music and get paid',
    template: '%s · FlyLink',
  },
  description,
  keywords: ['music smart links', 'link in bio for artists', 'pre-save', 'sell concert tickets', 'artist tip jar', 'music merch', 'fan email capture', 'record label roster', 'Pennyfly'],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'FlyLink',
    title: 'FlyLink — one page to share your music and get paid',
    description: tagline,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlyLink — one page to share your music and get paid',
    description: tagline,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard/overview"
      signUpFallbackRedirectUrl="/dashboard/overview"
    >
      <html lang="en" className={`${inter.className} h-full antialiased`}>
        <body className="min-h-full bg-background text-foreground">{children}</body>
      </html>
    </ClerkProvider>
  )
}
