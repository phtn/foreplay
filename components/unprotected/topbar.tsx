import { Brand } from '@/components/layouts/brand'
import { Navbar, type NavItem } from '@/components/layouts/navbar'
import { buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const GUEST_NAV_ITEMS: NavItem[] = [
  { value: '/', label: 'Dashboard', icon: 'home-line' },
  { value: '/tournaments', label: 'Tournaments', icon: 'trophy-line' },
  { value: '/entries', label: 'Entries', icon: 'ticket' },
  { value: '/records', label: 'Scorecard', icon: 'bar-chart' }
]
export function Topbar({ pathname }: { pathname: string }) {
  return (
    <header className='relative z-20 flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12'>
      <Brand className='dark:text-foreground' />
      <Navbar pathname={pathname} items={GUEST_NAV_ITEMS} />

      <div className='flex items-center gap-2'>
        <ThemeToggle />
        <Link
          className={cn(
            buttonVariants({ size: 'sm' }),
            'w-auto rounded-lg bg-[#1d2824] ps-3! text-white hover:bg-[#2f3d37]'
          )}
          href='/auth/login'>
          Sign in
          <Icon name='chevron-right' className='size-4' />
        </Link>
      </div>
    </header>
  )
}
