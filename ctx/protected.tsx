'use client'

import { Button } from '@/components/ui/button'

import { useTheme } from '@/components/theme/provider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
  { path: '/', label: 'Tournaments', icon: 'flag-line' },
  { path: '/my-registrations', label: 'My Registrations', icon: 'flag-line' },
  { path: '/organizer', label: 'Organizer', icon: 'flag-line' },
  { path: '/finance', label: 'Finance', icon: 'flag-line' },
  { path: '/scanner', label: 'Scanner', icon: 'flag-line' }
]

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const { on: mobileOpen, setOn: setMobileOpen } = useToggle(false)
  const { user } = useFirebaseUser()
  const { toggle } = useTheme()
  const pathname = usePathname()

  // const handleLogout = () => {
  //   base44.auth.logout("/login");
  // };

  return (
    <div className='min-h-screen bg-background'>
      {/* Top Nav */}
      <header className='sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b'>
        <div className='max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-6'>
          <Link href='/' className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-lg bg-primary flex items-center justify-center'>
              <Icon name='flag-fill' className='w-5 h-5 text-primary-foreground' />
            </div>
            <span className='font-heading text-xl font-bold tracking-tight hidden sm:inline'>GolfTour</span>
          </Link>

          {/* Desktop Nav */}
          <nav className='hidden md:flex items-center gap-1'>
            {navItems.map((item) => {
              const active = pathname.split('/').pop() === item.path.replace('/', '')
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}>
                  <Icon name={item.icon} className='size-3' />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className='flex items-center gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant='ghost' size='sm' className='gap-2'>
                    <div className='size-6 rounded-full bg-primary/10 flex items-center justify-center'>
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
                <DropdownMenuItem onClick={toggle} className=' rounded-sm'>
                  <Icon name='theme' className='size-4 mr-2' /> Theme
                </DropdownMenuItem>
                <DropdownMenuItem onClick={undefined} className=' rounded-sm rounded-b-xl'>
                  <Icon name='arrow-right' className='w-4 h-4 mr-2' /> Logout
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
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}>
                  <Icon name={item.icon} className='size-3' />
                  {item.label}
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
