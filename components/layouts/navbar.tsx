'use client'

import { useRouter } from 'next/navigation'

import { Tab, Tabs } from '@/components/ui/tabs'
import { type IconName } from '@/lib/icons'
import { startTransition } from 'react'

export interface NavItem {
  value: string
  label: string
  icon: IconName
}

export const NAV_ITEMS: NavItem[] = [
  { value: '/', label: 'Home', icon: 'home-line' },
  { value: '/tournaments', label: 'Tournaments', icon: 'trophy-line' },
  { value: '/subscriptions', label: 'My Entries', icon: 'ticket' },
  { value: '/records', label: 'Scorecard', icon: 'bar-chart' }
]

export function getActiveNavPath(pathname: string) {
  const match = NAV_ITEMS.find((item) => isNavItemActive(pathname, item.value))

  return match?.value ?? NAV_ITEMS[0]?.value ?? '/'
}

export function isNavItemActive(pathname: string, path: string) {
  if (path === '/') {
    return pathname === '/'
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}

interface NavbarProps {
  pathname: string
  items?: NavItem[]
}

export const Navbar = ({ pathname, items = NAV_ITEMS }: NavbarProps) => {
  const router = useRouter()
  const activePath = getActiveNavPath(pathname)

  return (
    <nav className='hidden md:flex items-center gap-3'>
      <Tabs
        key={activePath}
        tabs={items as Tab[]}
        defaultValue={activePath}
        onValueChange={(nextPath) => {
          startTransition(() => {
            router.push(nextPath)
          })
        }}
        // className='rounded-md'
      />
    </nav>
  )
}
