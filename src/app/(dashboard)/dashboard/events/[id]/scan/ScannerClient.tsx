'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import jsQR from 'jsqr'
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ScanLine, Loader2 } from 'lucide-react'

type Result = {
  result: 'valid' | 'used' | 'invalid'
  buyerName?: string | null
  ticketType?: string
  checkedInAt?: string
  reason?: string
}

// Minimal shape of the browser BarcodeDetector API (not in TS DOM lib).
type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> }
type DetectorCtor = { new (opts: { formats: string[] }): Detector }

export default function ScannerClient({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [scanning, setScanning] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [manual, setManual] = useState('')

  async function validate(token: string) {
    setChecking(true)
    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, eventId }),
      })
      const data = (await res.json()) as Result
      setResult(data)
    } catch {
      setResult({ result: 'invalid', reason: 'Network error' })
    }
    setChecking(false)
    stopCamera()
    setScanning(false)
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  // Decode the current video frame with jsQR (fallback for browsers without the
  // native BarcodeDetector — notably iOS Safari). Returns the QR text or null.
  function decodeFrame(video: HTMLVideoElement): string | null {
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return null
    // Cap the working resolution for speed on mobile; plenty for a QR code.
    const scale = Math.min(1, 640 / Math.max(w, h))
    const cw = Math.round(w * scale)
    const ch = Math.round(h * scale)
    const canvas = canvasRef.current ?? (canvasRef.current = document.createElement('canvas'))
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, cw, ch)
    const { data } = ctx.getImageData(0, 0, cw, ch)
    const code = jsQR(data, cw, ch, { inversionAttempts: 'dontInvert' })
    return code?.data ?? null
  }

  async function startScan() {
    setResult(null)
    // getUserMedia is required for any live scanning. Without it, manual only.
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false)
      return
    }
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setSupported(true)

      // Prefer the native detector (fast, Chrome/Android); fall back to jsQR.
      const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector
      const detector = Ctor ? new Ctor({ formats: ['qr_code'] }) : null

      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return
        try {
          let value: string | null = null
          if (detector) {
            const codes = await detector.detect(videoRef.current)
            value = codes[0]?.rawValue ?? null
          } else {
            value = decodeFrame(videoRef.current)
          }
          if (value) {
            await validate(value.trim())
            return
          }
        } catch {
          /* keep trying */
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    } catch {
      setScanning(false)
      stopCamera()
      setSupported(false)
    }
  }

  useEffect(() => () => stopCamera(), [])

  const banner =
    result?.result === 'valid'
      ? { cls: 'bg-green-500/15 border-green-500/40 text-green-300', Icon: CheckCircle2, title: 'Admit' }
      : result?.result === 'used'
        ? { cls: 'bg-amber-500/15 border-amber-500/40 text-amber-300', Icon: AlertTriangle, title: 'Already checked in' }
        : result
          ? { cls: 'bg-red-500/15 border-red-500/40 text-red-300', Icon: XCircle, title: 'Invalid' }
          : null

  return (
    <div className="p-6 max-w-md mx-auto">
      <Link href={`/dashboard/events/${eventId}/tickets`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tickets
      </Link>
      <h1 className="text-xl font-bold text-white">Door scanner</h1>
      <p className="text-sm text-zinc-400 mt-1 mb-6">{eventTitle}</p>

      {/* Result banner */}
      {banner && result && (
        <div className={`rounded-2xl border p-5 mb-4 ${banner.cls}`}>
          <div className="flex items-center gap-2 mb-1">
            <banner.Icon className="w-6 h-6" />
            <span className="text-lg font-bold">{banner.title}</span>
          </div>
          {result.result !== 'invalid' ? (
            <div className="text-sm opacity-90">
              <p className="font-medium">{result.buyerName || 'Guest'}</p>
              <p>{result.ticketType}</p>
              {result.result === 'used' && result.checkedInAt && (
                <p className="mt-1 text-xs opacity-80">
                  Scanned {new Date(result.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm opacity-90">{result.reason ?? 'Not a valid ticket'}</p>
          )}
        </div>
      )}

      {/* Camera */}
      {scanning ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square mb-4">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-8 border-2 border-white/60 rounded-2xl" />
          {checking && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={startScan}
          className="w-full py-4 bg-yellow-400 text-black rounded-xl font-semibold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <ScanLine className="w-5 h-5" /> {result ? 'Scan next' : 'Start scanning'}
        </button>
      )}

      {supported === false && (
        <p className="text-xs text-amber-400 mb-4">
          Couldn&apos;t access the camera — check camera permissions for this site, or use manual entry below.
        </p>
      )}

      {/* Manual fallback */}
      <div className="border-t border-zinc-800 pt-4">
        <p className="text-xs text-zinc-500 mb-2">Or enter a ticket code manually</p>
        <div className="flex items-center gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Ticket code"
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={() => manual.trim() && validate(manual.trim())}
            disabled={checking || !manual.trim()}
            className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:border-zinc-500 disabled:opacity-50 transition-colors"
          >
            Check
          </button>
        </div>
      </div>
    </div>
  )
}
