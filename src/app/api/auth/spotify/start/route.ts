import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getAuthorizeUrl } from '@/lib/spotify'

// Kicks off Spotify OAuth. ?type=presave|link & id=<campaignId|promoLinkId>
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  const id = req.nextUrl.searchParams.get('id')

  if ((type !== 'presave' && type !== 'link') || !id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!process.env.SPOTIFY_CLIENT_ID) {
    return NextResponse.json({ error: 'Spotify is not configured' }, { status: 503 })
  }

  const nonce = randomBytes(16).toString('hex')
  const state = Buffer.from(JSON.stringify({ t: type, id, n: nonce })).toString('base64url')

  const res = NextResponse.redirect(getAuthorizeUrl(state))
  res.cookies.set('sp_oauth_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600, // 10 min
  })
  return res
}
