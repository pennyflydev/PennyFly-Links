import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlyLink — Smart Links for Musicians',
  description: 'One link for all your music. Smart links, pre-save campaigns, and fan capture for artists and labels.',
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
