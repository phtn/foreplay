'use client'

import { Button } from '@/components/ui/button'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SignOutButton } from '@/components/ui/signout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useToggle } from '@/hooks/use-toggle'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon, IconName } from '@/lib/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'

interface NavItem {
  path: string
  label: string
  icon: IconName
}
const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: 'home-line' },
  { path: '/tournaments', label: 'Tournaments', icon: 'flag-line' },
  // { path: '/leagues', label: 'Browse Leagues', icon: 'squircle' },
  { path: '/entries', label: 'My Entries', icon: 'ticket' },
  { path: '/records', label: 'Track Record', icon: 'golf-flag' }
]

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const { on: mobileOpen, setOn: setMobileOpen } = useToggle(false)
  const { user } = useFirebaseUser()
  const pathname = usePathname()

  // const handleLogout = () => {
  //   base44.auth.logout("/login");
  // };

  return (
    <div className='min-h-screen bg-background'>
      {/* Top Nav */}
      <header className='sticky top-0 z-50 bg-primary/5 backdrop-blur-xl border-b'>
        <div className='max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-6'>
          <Link href='/' className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-xl bg-primary flex items-center justify-center'>
              <Icon name='golf-tee' className='size-6 text-white' />
            </div>
            <span className='font-heading text-xl font-bold tracking-tight hidden sm:inline'>GolfTour</span>
          </Link>

          {/* Desktop Nav */}
          <nav className='hidden md:flex items-center gap-3'>
            {navItems.map((item) => {
              const active = pathname.split('/').pop() === item.path.replace('/', '')
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-accent text-primary-foreground'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  }`}>
                  <Icon name={item.icon} className='size-4 xl:size-5' />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className='flex items-center gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant='ghost' size='sm' className='gap-2'>
                    <div className='size-5 rounded-full bg-primary/10 flex items-center justify-center'>
                      <Icon name='flag-fill' className='size-3.5 text-primary' />
                    </div>
                    <span className='hidden sm:inline text-sm'>
                      {user?.displayName?.split(' ').shift() || user?.email}
                    </span>
                    <Icon name='chevron-down' className='size-2 opacity-60' />
                  </Button>
                }></DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem className='text-xs text-muted-foreground rounded-sm rounded-t-xl'>
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={undefined} className=' rounded-sm'>
                  <ThemeToggle withLabel />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={undefined} className='rounded-sm rounded-b-xl'>
                  <SignOutButton withLabel />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant='ghost' size='icon' className='md:hidden' onClick={() => setMobileOpen(!mobileOpen)}>
              <Icon name={mobileOpen ? 'close' : 'menu'} className='size-4' />
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className='md:hidden border-t bg-card px-4 py-3 space-y-1'>
            {navItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent/70 text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}>
                  <Icon name={item.icon} className='size-3' />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </header>

      <main className='max-w-7xl mx-auto px-4 md:px-6 py-6'>{children}</main>
    </div>
  )
}
