import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { getCurrentProfile } from '@/lib/supabase/queries'

export default async function LabelLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'
  const isLabel = profile?.role === 'label'
  if (!isAdmin && !isLabel) redirect('/dashboard/overview')

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar isAdmin={isAdmin} isLabel={isLabel} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
