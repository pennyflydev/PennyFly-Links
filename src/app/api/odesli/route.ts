import { NextRequest, NextResponse } from 'next/server'
import { fetchStreamingLinks } from '@/lib/odesli'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const result = await fetchStreamingLinks(url)
  if (!result) return NextResponse.json({ error: 'Could not fetch links' }, { status: 404 })

  return NextResponse.json(result)
}
