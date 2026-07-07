import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

// Classify a visitor's device from the user-agent string.
export function deviceFromUA(ua: string | null | undefined): 'mobile' | 'tablet' | 'desktop' {
  if (!ua) return 'desktop'
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile'
  return 'desktop'
}

// Convert a pasted media URL into an embeddable iframe source.
// Supports Spotify, YouTube, Apple Music, SoundCloud. Returns null if unknown.
export function toMediaEmbed(url: string): { src: string; height: number; aspect: boolean } | null {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\.|^m\./, '')

    if (host === 'open.spotify.com') {
      const m = u.pathname.match(/\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/)
      if (m) {
        const compact = m[1] === 'track' || m[1] === 'episode'
        return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: compact ? 152 : 352, aspect: false }
      }
    }
    if (host === 'youtube.com') {
      const id = u.searchParams.get('v')
      if (id) return { src: `https://www.youtube.com/embed/${id}`, height: 0, aspect: true }
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1)
      if (id) return { src: `https://www.youtube.com/embed/${id}`, height: 0, aspect: true }
    }
    if (host === 'music.apple.com') {
      const isSong = u.searchParams.has('i')
      return { src: url.replace('music.apple.com', 'embed.music.apple.com'), height: isSong ? 175 : 450, aspect: false }
    }
    if (host === 'soundcloud.com') {
      return { src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=true`, height: 300, aspect: false }
    }
    return null
  } catch {
    return null
  }
}

// A FlyLink is publicly live only if published AND inside its schedule window.
export function isLinkLive(link: {
  is_published?: boolean
  publish_at?: string | null
  expires_at?: string | null
}): boolean {
  if (!link.is_published) return false
  const now = Date.now()
  if (link.publish_at && new Date(link.publish_at).getTime() > now) return false
  if (link.expires_at && new Date(link.expires_at).getTime() <= now) return false
  return true
}
