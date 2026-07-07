import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

type Link = { label: string; url: string }

// Fallback: walk the page JSON for anything shaped like a titled link.
function collect(obj: unknown, out: Link[], seen: Set<string>) {
  if (!obj || typeof obj !== 'object') return
  if (Array.isArray(obj)) { obj.forEach((o) => collect(o, out, seen)); return }
  const rec = obj as Record<string, unknown>
  const url = rec.url
  const label = rec.title ?? rec.text ?? rec.label
  if (
    typeof url === 'string' && /^https?:\/\//.test(url) &&
    typeof label === 'string' && label.trim() &&
    !/linktr\.ee|\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(url) &&
    !seen.has(url)
  ) {
    seen.add(url)
    out.push({ label: label.trim().slice(0, 60), url })
  }
  for (const k in rec) collect(rec[k], out, seen)
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url') ?? ''
  let host = ''
  try { host = new URL(url).hostname } catch { return NextResponse.json({ error: 'Invalid link' }, { status: 400 }) }
  if (!/(^|\.)linktr\.ee$/.test(host)) {
    return NextResponse.json({ error: 'Paste a linktr.ee link' }, { status: 400 })
  }

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 FlyLinkImporter' } })
    if (!res.ok) return NextResponse.json({ error: 'Could not load that Linktree' }, { status: 502 })
    const html = await res.text()

    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/)
    if (!m) return NextResponse.json({ links: [] })

    const data = JSON.parse(m[1])
    const out: Link[] = []
    const seen = new Set<string>()

    // Known path first, then fall back to a full walk.
    type LtLink = { title?: string; url?: string }
    const known = (data?.props?.pageProps?.account?.links as LtLink[] | undefined) ?? []
    for (const l of known) {
      if (l.url && /^https?:\/\//.test(l.url) && l.title?.trim() && !seen.has(l.url)) {
        seen.add(l.url)
        out.push({ label: l.title.trim().slice(0, 60), url: l.url })
      }
    }
    if (out.length === 0) collect(data, out, seen)

    return NextResponse.json({ links: out.slice(0, 50) })
  } catch {
    return NextResponse.json({ error: 'Could not read that Linktree' }, { status: 502 })
  }
}
