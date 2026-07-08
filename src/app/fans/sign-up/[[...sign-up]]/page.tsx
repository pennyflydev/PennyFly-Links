import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

// Fan signup. The unsafeMetadata flag tells the Clerk webhook to create a
// listener account (role='fan', no artist page) instead of an artist.
export default function FanSignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">FlyLink for Fans</h1>
          <p className="text-zinc-400 mt-1">Follow your favorite artists and never miss a drop</p>
        </div>
        <SignUp
          path="/fans/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/fans"
          unsafeMetadata={{ accountType: 'fan' }}
        />
        <p className="text-sm text-zinc-500">
          Are you an artist?{' '}
          <Link href="/sign-up" className="text-yellow-400 hover:underline">
            Create an artist account
          </Link>
        </p>
      </div>
    </div>
  )
}
