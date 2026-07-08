import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">FlyLink</h1>
          <p className="text-zinc-400 mt-1">Start your free 7-day trial</p>
        </div>
        <SignUp />
        <p className="text-sm text-zinc-500">
          Just here to follow artists?{' '}
          <Link href="/fans/sign-up" className="text-yellow-400 hover:underline">
            Create a fan account
          </Link>
        </p>
      </div>
    </div>
  )
}
