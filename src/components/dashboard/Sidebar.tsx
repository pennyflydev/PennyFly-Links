'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AccountMenu from './AccountMenu'
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
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean }

// Grouped so a 14-item list reads as a few short, labelled sections instead of
// one long wall of links.
const navGroups: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/artist-page', label: 'Artist Page', icon: User },
      { href: '/dashboard/links', label: 'My FlyLinks', icon: Link2 },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/dashboard/pre-save', label: 'Pre-save', icon: Calendar },
      { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
    ],
  },
  {
    title: 'Monetize',
    items: [
      { href: '/dashboard/store', label: 'Store', icon: ShoppingBag },
      { href: '/dashboard/membership', label: 'Membership', icon: Star },
      { href: '/dashboard/tips', label: 'Tip Jar', icon: Heart },
      { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    title: 'Audience',
    items: [
      { href: '/dashboard/subscribers', label: 'Subscribers', icon: Users },
      { href: '/dashboard/sms', label: 'SMS Alerts', icon: Smartphone },
      { href: '/dashboard/fan-wall', label: 'Fan Wall', icon: MessageSquare },
    ],
  },
]

export default function Sidebar({
  isAdmin = false,
  isLabel = false,
  variant = 'artist',
}: {
  isAdmin?: boolean
  isLabel?: boolean
  variant?: 'artist' | 'label'
}) {
  const pathname = usePathname()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
      active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
    )

  // Label-context primary nav (rendered in the (label) layout: /label, /roster, /admin).
  const labelNav: NavItem[] = [
    ...(isAdmin ? [{ href: '/admin', label: 'Platform', icon: BarChart3 }] : []),
    { href: '/label', label: 'Label HQ', icon: TrendingUp, exact: true },
    { href: '/roster', label: isAdmin ? 'All Artists' : 'My Roster', icon: Radio },
  ]

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
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {variant === 'label'
          ? labelNav.map(({ href, label, icon: Icon, exact }) => (
              <Link key={href} href={href} className={linkClass(isActive(href, exact))}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))
          : navGroups.map((group, gi) => (
              <div key={group.title ?? gi} className={gi > 0 ? 'pt-3' : ''}>
                {group.title && (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{group.title}</p>
                )}
                <div className="space-y-0.5">
                  {group.items.map(({ href, label, icon: Icon, exact }) => (
                    <Link key={href} href={href} className={linkClass(isActive(href, exact))}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-zinc-800 space-y-1">
        {variant === 'artist' && (
          <>
            {!isLabel && (
              <Link href="/dashboard/settings" className={linkClass(pathname.startsWith('/dashboard/settings'))}>
                <Settings className="w-4 h-4 shrink-0" />
                Settings
              </Link>
            )}
            <Link href="/dashboard/refer" className={linkClass(pathname.startsWith('/dashboard/refer'))}>
              <Gift className="w-4 h-4 shrink-0" />
              Refer &amp; earn
            </Link>
            {/* Jump to the label/admin area (also lets an impersonating label get back). */}
            {(isAdmin || isLabel) && (
              <Link
                href="/label"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                  'text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/5'
                )}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                Label HQ
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/5"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                Platform
              </Link>
            )}
          </>
        )}
        <div className={variant === 'artist' ? 'pt-2 mt-1 border-t border-zinc-800' : ''}>
          <AccountMenu isLabel={isLabel} />
        </div>
      </div>
    </aside>
  )
}
