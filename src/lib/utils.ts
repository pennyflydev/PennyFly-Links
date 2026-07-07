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
