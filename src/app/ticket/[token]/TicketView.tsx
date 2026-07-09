'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Calendar, MapPin, Ticket, CheckCircle2, Music2, Wallet } from 'lucide-react'

export default function TicketView({
  token,
  buyerName,
  status,
  checkedInAt,
  eventTitle,
  startAt,
  venue,
  city,
  ticketType,
  walletUrl,
}: {
  token: string
  buyerName: string | null
  status: string
  checkedInAt: string | null
  eventTitle: string
  startAt: string | null
  venue: string | null
  city: string | null
  ticketType: string
  walletUrl: string | null
}) {
  const [qr, setQr] = useState<string | null>(null)
  const used = status === 'used'
  const refunded = status === 'refunded'

  useEffect(() => {
    QRCode.toDataURL(token, { width: 320, margin: 1 }).then(setQr).catch(() => setQr(null))
  }, [token])

  const dateStr = startAt
    ? new Date(startAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : ''

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-dashed border-zinc-700">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-[0.2em] mb-2">{ticketType}</p>
          <h1 className="text-2xl font-bold">{eventTitle}</h1>
          {buyerName && <p className="text-zinc-400 mt-1 text-sm">{buyerName}</p>}
          <div className="mt-4 space-y-1 text-sm text-white/70">
            {dateStr && (
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-white/40" /> {dateStr}
              </div>
            )}
            {(venue || city) && (
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-white/40" /> {[venue, city].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* QR / status */}
        <div className="p-6 flex flex-col items-center gap-3">
          {refunded ? (
            <div className="py-10 text-center">
              <p className="text-red-400 font-semibold">Refunded</p>
              <p className="text-xs text-zinc-500 mt-1">This ticket is no longer valid.</p>
            </div>
          ) : used ? (
            <div className="py-10 text-center flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-green-400 font-semibold">Checked in</p>
              {checkedInAt && (
                <p className="text-xs text-zinc-500">
                  {new Date(checkedInAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
          ) : qr ? (
            <>
              <img src={qr} alt="Ticket QR code" className="w-56 h-56 rounded-xl bg-white p-2" />
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" /> Show this at the door — single use
              </p>
              {walletUrl && (
                <a
                  href={walletUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  <Wallet className="w-4 h-4" /> Add to Google Wallet
                </a>
              )}
            </>
          ) : (
            <div className="w-56 h-56 rounded-xl bg-zinc-800 animate-pulse" />
          )}
        </div>

        <div className="pb-5 flex items-center justify-center gap-1.5 text-zinc-600 text-xs">
          <Music2 className="w-3 h-3" /> Powered by FlyLink
        </div>
      </div>
    </div>
  )
}
