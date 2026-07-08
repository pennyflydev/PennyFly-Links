import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Music2 } from 'lucide-react'
import { getCurrentProfile } from '@/lib/supabase/queries'

// Guards the signed-in fan area. Lives in the (app) route group so it does
// NOT wrap /fans/sign-up (which must stay public).
export default async function FansLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const profile = await getCurrentProfile()
  // Artists, labels, and admins manage from the dashboard, not the fan feed.
  if (profile && profile.role !== 'fan') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 border-b border-zinc-900 bg-black/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/fans" className="flex items-center gap-2 font-bold">
            <Music2 className="w-5 h-5 text-yellow-400" />
            FlyLink
          </Link>
          <UserButton />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
