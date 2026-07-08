'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Music2, Calendar, MapPin, Ticket, Loader2 } from 'lucide-react'

export type PublicTicketType = {
  id: string
  name: string
  price_cents: number
  quantity: number | null
  sold: number
}

type Props = {
  title: string
  artistName: string
  artistSlug: string | null
  description: string
  coverUrl: string | null
  startAt: string
  venue: string
  city: string
  ticketUrl: string | null
  ticketTypes: PublicTicketType[]
  chargesEnabled: boolean
}

function TicketPurchase({ types, chargesEnabled }: { types: PublicTicketType[]; chargesEnabled: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function buy(type: PublicTicketType) {
    if (busy) return
    setError(null)
    if (!name.trim() || !email.trim()) return setError('Enter your name and email.')
    setBusy(true)
    try {
      const paid = type.price_cents > 0
      const res = await fetch(paid ? '/api/tickets/checkout' : '/api/tickets/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketTypeId: type.id, name, email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Could not get ticket'); setBusy(false); return }
      window.location.href = paid ? data.url : `/ticket/${data.token}`
    } catch {
      setError('Something went wrong — please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="w-full space-y-2">
      {types.map((t) => {
        const soldOut = t.quantity != null && t.sold >= t.quantity
        const paid = t.price_cents > 0
        const disabledPaid = paid && !chargesEnabled
        const open = openId === t.id
        return (
          <div key={t.id} className="w-full bg-white/10 border border-white/20 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-white/60">
                  {paid ? `$${(t.price_cents / 100).toFixed(2)}` : 'Free'}
                  {t.quantity != null && !soldOut ? ` · ${t.quantity - t.sold} left` : ''}
                </p>
              </div>
              <button
                disabled={soldOut || disabledPaid}
                onClick={() => setOpenId(open ? null : t.id)}
                className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {soldOut ? 'Sold out' : disabledPaid ? 'Unavailable' : open ? 'Close' : 'Get'}
              </button>
            </div>
            {open && !soldOut && !disabledPaid && (
              <div className="px-3 pb-3 space-y-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40" />
                {error && <p className="text-xs text-red-300">{error}</p>}
                <button onClick={() => buy(t)} disabled={busy}
                  className="w-full py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                  {paid ? `Buy — $${(t.price_cents / 100).toFixed(2)}` : 'Get free ticket'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export default function EventClient(props: Props) {
  const startAt = new Date(props.startAt)
  const [countdown, setCountdown] = useState(() => getCountdown(startAt))
  const past = countdown === null

  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown(startAt)), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.startAt])

  const dateStr = startAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = startAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        {props.coverUrl ? (
          <img src={props.coverUrl} alt={props.title} className="w-full aspect-square max-w-xs rounded-2xl object-cover shadow-2xl" />
        ) : (
          <div className="w-full aspect-square max-w-xs rounded-2xl bg-zinc-800 flex items-center justify-center shadow-2xl">
            <Calendar className="w-16 h-16 text-zinc-600" />
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-[0.2em] mb-2">{past ? 'Past Event' : 'Upcoming'}</p>
          <h1 className="text-3xl font-bold">{props.title}</h1>
          {props.artistName && <p className="text-zinc-400 mt-1">{props.artistName}</p>}
        </div>

        {!past && countdown && (
          <div className="flex items-center gap-3">
            {[
              { v: countdown.days, l: 'Days' },
              { v: countdown.hours, l: 'Hrs' },
              { v: countdown.minutes, l: 'Min' },
              { v: countdown.seconds, l: 'Sec' },
            ].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center bg-zinc-900 border border-zinc-800 rounded-xl w-16 py-2">
                <span className="text-2xl font-bold tabular-nums">{String(v).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">{l}</span>
              </div>
            ))}
          </div>
        )}

        <div className="w-full space-y-2 text-sm">
          <div className="flex items-center justify-center gap-2 text-white/80">
            <Calendar className="w-4 h-4 text-white/50" /> {dateStr} · {timeStr}
          </div>
          {(props.venue || props.city) && (
            <div className="flex items-center justify-center gap-2 text-white/80">
              <MapPin className="w-4 h-4 text-white/50" /> {[props.venue, props.city].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {props.description && <p className="text-sm text-zinc-500 leading-relaxed">{props.description}</p>}

        {/* Native tickets (FlyLink ticketing). Falls back to external link. */}
        {!past && props.ticketTypes.length > 0 ? (
          <TicketPurchase types={props.ticketTypes} chargesEnabled={props.chargesEnabled} />
        ) : (
          props.ticketUrl && !past && (
            <a href={props.ticketUrl} target="_blank" rel="noopener noreferrer"
              className="w-full py-3.5 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
              <Ticket className="w-4 h-4" /> Get Tickets
            </a>
          )
        )}

        {props.artistSlug && (
          <Link href={`/${props.artistSlug}`} className="text-sm text-zinc-500 hover:text-white transition-colors">
            More from {props.artistName} →
          </Link>
        )}

        <div className="mt-2 flex items-center gap-1.5 text-zinc-600 text-xs">
          <Music2 className="w-3 h-3" />
          <span>Powered by FlyLink</span>
        </div>
      </div>
    </div>
  )
}
