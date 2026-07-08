import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Landing after a paid ticket checkout. The webhook issues the ticket; we look
// it up by the Stripe session id and forward to the ticket. If the webhook is
// still catching up, we show a gentle "finalizing" state.
export default async function TicketSuccessPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams
  if (s) {
    const supabase = createAdminClient()
    const { data: ticket } = await supabase.from('tickets').select('token').eq('order_id', s).maybeSingle()
    if (ticket?.token) redirect(`/ticket/${ticket.token}`)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center gap-4">
      <div className="w-10 h-10 border-2 border-zinc-700 border-t-yellow-400 rounded-full animate-spin" />
      <h1 className="text-xl font-semibold">Finalizing your ticket…</h1>
      <p className="text-sm text-zinc-400 max-w-xs">
        Payment received. Your ticket is being issued — this can take a few seconds. We&apos;ll also email it to you.
      </p>
      <Link href="" className="text-sm text-yellow-400 hover:underline">Refresh</Link>
    </div>
  )
}
