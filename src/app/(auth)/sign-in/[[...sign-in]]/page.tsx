import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">FlyLink</h1>
          <p className="text-zinc-400 mt-1">Smart links for musicians</p>
        </div>
        <SignIn />
      </div>
    </div>
  )
}
