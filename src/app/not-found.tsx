import Link from 'next/link'
import { Music2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 text-center">
      <div className="flex items-center gap-2 mb-8">
        <Music2 className="w-6 h-6 text-yellow-400" />
        <span className="text-lg font-bold tracking-tight">FlyLink</span>
      </div>
      <h1 className="text-6xl font-bold mb-3">404</h1>
      <p className="text-zinc-400 mb-8 max-w-sm">
        This page doesn&apos;t exist or may have been moved. Check the link and try again.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
