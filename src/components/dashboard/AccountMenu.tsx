'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useUser, useClerk, useSessionList } from '@clerk/nextjs'
import { ChevronsUpDown, Settings, LogOut, UserPlus, UserCog, Check, CreditCard } from 'lucide-react'

// The bottom-left account drawer. The whole bar is clickable and opens a popover
// with: the current account, any other signed-in accounts to switch between,
// "add another account", and quick links (manage account, settings, sign out).
//
// Switching between multiple accounts requires multi-session mode to be enabled
// on the Clerk instance; without it there is only ever one active session and
// the switch list stays empty (only "Add another account" shows).
export default function AccountMenu({ isLabel = false }: { isLabel?: boolean }) {
  const { user } = useUser()
  const clerk = useClerk()
  const { isLoaded, sessions, setActive } = useSessionList()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onDoc)
      document.addEventListener('keydown', onEsc)
    }
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (!user) return null

  const name = user.fullName || user.username || 'Your account'
  const email = user.primaryEmailAddress?.emailAddress ?? ''

  // Other signed-in accounts on this device (multi-session).
  const others = isLoaded
    ? (sessions ?? []).filter((s) => s.status === 'active' && s.user && s.user.id !== user.id)
    : []

  async function switchTo(sessionId: string) {
    if (!setActive || busy) return
    setBusy(true)
    await setActive({ session: sessionId })
    // Re-enter the app so layouts re-resolve the new account's role/routing.
    window.location.assign('/dashboard')
  }

  const itemCls = 'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors'

  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 p-1.5">
          {/* Current account */}
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{name}</p>
              {email && <p className="text-[11px] text-zinc-500 truncate">{email}</p>}
            </div>
            <Check className="w-4 h-4 text-yellow-400 shrink-0" />
          </div>

          {/* Switch to another signed-in account */}
          {others.length > 0 && (
            <div className="mt-1 border-t border-zinc-800 pt-1">
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Switch account</p>
              {others.map((s) => (
                <button key={s.id} onClick={() => switchTo(s.id)} disabled={busy} className={itemCls}>
                  <img src={s.user!.imageUrl} alt="" className="w-6 h-6 rounded-full shrink-0" />
                  <span className="flex-1 min-w-0 text-left truncate">
                    {s.user!.primaryEmailAddress?.emailAddress || s.user!.fullName || 'Account'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 border-t border-zinc-800 pt-1">
            <button onClick={() => clerk.openSignIn()} className={itemCls}>
              <UserPlus className="w-4 h-4 shrink-0" /> Add another account
            </button>
          </div>

          {/* Quick links */}
          <div className="mt-1 border-t border-zinc-800 pt-1">
            <button onClick={() => { clerk.openUserProfile(); setOpen(false) }} className={itemCls}>
              <UserCog className="w-4 h-4 shrink-0" /> Manage account
            </button>
            {!isLabel && (
              <Link href="/dashboard/settings" onClick={() => setOpen(false)} className={itemCls}>
                <Settings className="w-4 h-4 shrink-0" /> Settings
              </Link>
            )}
            {!isLabel && (
              <Link href="/dashboard/settings?billing=manage" onClick={() => setOpen(false)} className={itemCls}>
                <CreditCard className="w-4 h-4 shrink-0" /> Billing &amp; plan
              </Link>
            )}
          </div>

          <div className="mt-1 border-t border-zinc-800 pt-1">
            <button onClick={() => clerk.signOut({ redirectUrl: '/' })} className={`${itemCls} hover:!text-red-300`}>
              <LogOut className="w-4 h-4 shrink-0" /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* The clickable bar */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-zinc-800/60 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <img src={user.imageUrl} alt="" className="w-7 h-7 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          {email && <p className="text-[11px] text-zinc-500 truncate">{email}</p>}
        </div>
        <ChevronsUpDown className="w-4 h-4 text-zinc-500 shrink-0" />
      </button>
    </div>
  )
}
