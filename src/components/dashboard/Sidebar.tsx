'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  User,
  Link2,
  Calendar,
  Users,
  Settings,
  Music2,
  Radio,
  BarChart3,
  MessageSquare,
  CalendarDays,
  Gift,
  ShoppingBag,
  Star,
  Heart,
  Smartphone,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/artist-page', label: 'Artist Page', icon: User },
  { href: '/dashboard/links', label: 'My FlyLinks', icon: Link2 },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/pre-save', label: 'Pre-save', icon: Calendar },
  { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
  { href: '/dashboard/store', label: 'Store', icon: ShoppingBag },
  { href: '/dashboard/membership', label: 'Membership', icon: Star },
  { href: '/dashboard/tips', label: 'Tip Jar', icon: Heart },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/subscribers', label: 'Subscribers', icon: Users },
  { href: '/dashboard/sms', label: 'SMS Alerts', icon: Smartphone },
  { href: '/dashboard/fan-wall', label: 'Fan Wall', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ isAdmin = false, isLabel = false }: { isAdmin?: boolean; isLabel?: boolean }) {
  const pathname = usePathname()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="w-56 flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-yellow-400 rounded-md flex items-center justify-center">
            <Music2 className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-white text-lg">FlyLink</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(href, exact)
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-zinc-800 space-y-3">
        <Link
          href="/dashboard/refer"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
            pathname.startsWith('/dashboard/refer')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          )}
        >
          <Gift className="w-4 h-4 shrink-0" />
          Refer &amp; earn
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
              pathname === '/admin'
                ? 'bg-yellow-400/10 text-yellow-400'
                : 'text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/5'
            )}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            Platform
          </Link>
        )}
        {(isAdmin || isLabel) && (
          <Link
            href="/roster"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
              pathname.startsWith('/roster')
                ? 'bg-yellow-400/10 text-yellow-400'
                : 'text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/5'
            )}
          >
            <Radio className="w-4 h-4 shrink-0" />
            {isAdmin ? 'All Artists' : 'My Roster'}
          </Link>
        )}
        <div className="flex items-center gap-3 px-3">
          <UserButton />
          <span className="text-xs text-zinc-500 truncate">Account</span>
        </div>
      </div>
    </aside>
  )
}
