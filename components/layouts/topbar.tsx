'use client'

import { Brand } from '@/components/layouts/brand'
import { NAV_ITEMS, Navbar, isNavItemActive, type NavItem } from '@/components/layouts/navbar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SignOutButton } from '@/components/ui/signout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useToggle } from '@/hooks/use-toggle'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { type User } from 'firebase/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const GUEST_NAV_ITEMS: NavItem[] = [
  { value: '/', label: 'Dashboard', icon: 'home-line' },
  { value: '/tournaments', label: 'Tournaments', icon: 'trophy-line' },
  { value: '/entries', label: 'Entries', icon: 'ticket' },
  { value: '/records', label: 'Scorecard', icon: 'bar-chart' }
]

interface AuthenticatedTopbarProps {
  pathname: string
  user: User | null
  mobileOpen: boolean
  toggleMobileOpen: () => void
  setMobileOpen: (value: boolean) => void
}

export function Topbar() {
  const pathname = usePathname()
  const { user } = useFirebaseUser()
  const { on: mobileOpen, toggle: toggleMobileOpen, setOn: setMobileOpen } = useToggle(false)

  if (user) {
    return (
      <AuthenticatedTopbar
        pathname={pathname}
        user={user}
        mobileOpen={mobileOpen}
        toggleMobileOpen={toggleMobileOpen}
        setMobileOpen={setMobileOpen}
      />
    )
  }

  return <GuestTopbar pathname={pathname} />
}

function AuthenticatedTopbar({
  pathname,
  user,
  mobileOpen,
  toggleMobileOpen,
  setMobileOpen
}: AuthenticatedTopbarProps) {
  return (
    <header
      className={cn('sticky top-0 z-50 overflow-visible', {
        'border-sky-950/20': pathname.includes('entry')
      })}>
      <div className='relative z-50'>
        <div className='mx-auto flex min-h-16 _max-w-7xl md:mt-3 items-center justify-between gap-3 px-3 py-2 sm:px-4 md:px-6'>
          <Brand className='dark:text-foreground' />
          <Navbar pathname={pathname} />

          <div className='flex items-center gap-2'>
            <div className='hidden sm:block'>
              <ThemeToggle />
            </div>
            <div className='relative z-60 flex items-center gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant='ghost' size='icon-sm' className='w-auto shrink-0 aspect-square rounded-full'>
                      <div className='flex size-5 items-center justify-center rounded-full bg-primary/10'>
                        <Avatar size='sm'>
                          <AvatarImage src={user?.photoURL ?? '/vercel.svg'} alt='pfp' />
                          <AvatarFallback>{user?.displayName?.split(' ').shift()?.substring(0, 1)}</AvatarFallback>
                        </Avatar>
                      </div>
                    </Button>
                  }
                />
                <DropdownMenuContent align='end' className=''>
                  <DropdownMenuItem className='rounded-sm rounded-t-xl'>
                    <ThemeToggle withLabel />
                  </DropdownMenuItem>
                  <DropdownMenuItem className='rounded-sm rounded-b-xl'>
                    <SignOutButton withLabel />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant='ghost'
                size='icon-sm'
                className='shrink-0 md:hidden hover:bg-slate-300/50'
                onClick={toggleMobileOpen}>
                <Icon name={mobileOpen ? 'close' : 'menu'} className='size-4 text-slate-500 dark:text-slate-400' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MobileNav pathname={pathname} onNavigate={() => setMobileOpen(false)} open={mobileOpen} />
    </header>
  )
}

function GuestTopbar({ pathname }: { pathname: string }) {
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

function MobileNav({ pathname, onNavigate, open }: { pathname: string; onNavigate: () => void; open: boolean }) {
  return (
    <div
      className={cn(
        'absolute left-0 right-0 top-full z-40 md:hidden',
        'origin-top transition-[opacity,transform,visibility] duration-200 ease-out',
        open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0 pointer-events-none'
      )}>
      <div className='mx-3 mt-2 rounded-2xl border border-border/60 bg-card px-2 pt-2 pb-4 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:mx-4'>
        <div className='space-y-2'>
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.value)
            return (
              <Link
                key={item.value}
                href={item.value}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  active ? 'bg-hermes text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}>
                <Icon name={item.icon} className='size-4' />
                <span className='font-okx'>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
