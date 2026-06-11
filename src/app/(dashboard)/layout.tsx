import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import ImpersonationBanner from '@/components/dashboard/ImpersonationBanner'
import { getCurrentProfile, getImpersonationContext } from '@/lib/supabase/queries'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [profile, impersonation] = await Promise.all([getCurrentProfile(), getImpersonationContext()])

  // New signups who haven't chosen artist vs label go to onboarding first.
  if (profile && !profile.onboarded && profile.role !== 'admin') redirect('/onboarding')

  // Label accounts don't have an artist dashboard — send them to their roster.
  if (profile?.role === 'label' && !impersonation) redirect('/roster')

  const isAdmin = profile?.role === 'admin'
  const isLabel = profile?.role === 'label'

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar isAdmin={isAdmin} isLabel={isLabel} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {impersonation && <ImpersonationBanner artistName={impersonation.artistName} />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
