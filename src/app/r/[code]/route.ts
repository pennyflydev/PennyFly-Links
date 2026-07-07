import { NextRequest, NextResponse } from 'next/server'

// Public referral link: /r/<code> → remember the referrer, then send to sign-up.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const res = NextResponse.redirect(new URL('/sign-up', req.url))
  res.cookies.set('flylink_ref', code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
