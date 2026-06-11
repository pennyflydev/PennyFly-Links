'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, X, Download, Loader2 } from 'lucide-react'

export default function QrButton({
  url,
  filename = 'flylink-qr',
  className,
  label,
}: {
  url: string
  filename?: string
  className?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [resolved, setResolved] = useState('')
  const [loading, setLoading] = useState(false)

  async function show() {
    setOpen(true)
    setLoading(true)
    const abs = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`
    setResolved(abs)
    try {
      const d = await QRCode.toDataURL(abs, { width: 512, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      setDataUrl(d)
    } catch {
      setDataUrl(null)
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={show}
        title="QR code"
        className={className ?? 'p-1.5 text-zinc-500 hover:text-white transition-colors'}
      >
        <QrCode className="w-4 h-4" />
        {label && <span className="ml-1.5">{label}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-xs flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold text-white">QR Code</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center overflow-hidden">
              {loading || !dataUrl ? (
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dataUrl} alt="QR code" className="w-full h-full" />
              )}
            </div>

            <p className="text-xs text-zinc-500 break-all text-center">{resolved}</p>

            {dataUrl && (
              <a
                href={dataUrl}
                download={`${filename}.png`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
