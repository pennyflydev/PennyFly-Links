'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Music2, Calendar, MapPin, Ticket } from 'lucide-react'

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

        {props.ticketUrl && !past && (
          <a href={props.ticketUrl} target="_blank" rel="noopener noreferrer"
            className="w-full py-3.5 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
            <Ticket className="w-4 h-4" /> Get Tickets
          </a>
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
