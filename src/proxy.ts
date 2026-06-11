import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/api/webhooks/(.*)',
  '/api/odesli',
  // Public artist pages — /:slug and /:slug/:linkSlug
  '/:slug',
  '/:slug/(.*)',
])

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/roster(.*)', '/onboarding'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId } = await auth()

  if (!userId && isDashboardRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
