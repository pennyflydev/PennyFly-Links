import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Landing after a paid-unlock checkout. The webhook records the unlock; we look
// it up by the Stripe session id, then forward to the (secret) reward_url. The
// reward is only ever revealed here after the unlock row exists (i.e. payment
// completed) — it is never sent to the public page.
export default async function UnlockSuccessPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams
  if (s) {
    const supabase = createAdminClient()
    const { data: unlock } = await supabase.from('unlocks').select('exclusive_id').eq('order_id', s).maybeSingle()
    if (unlock?.exclusive_id) {
      const { data: item } = await supabase
        .from('exclusive_content')
        .select('reward_url')
        .eq('id', unlock.exclusive_id)
        .single()
      if (item?.reward_url) redirect(item.reward_url)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center gap-4">
      <div className="w-10 h-10 border-2 border-zinc-700 border-t-yellow-400 rounded-full animate-spin" />
      <h1 className="text-xl font-semibold">Unlocking…</h1>
      <p className="text-sm text-zinc-400 max-w-xs">
        Payment received. We&apos;re revealing your reward — this can take a few seconds. We&apos;ll also email you the link.
      </p>
      <Link href="" className="text-sm text-yellow-400 hover:underline">Refresh</Link>
    </div>
  )
}
