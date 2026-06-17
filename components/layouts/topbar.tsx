import { NAV_ITEMS, Navbar, isNavItemActive } from '@/components/layouts/navbar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SignOutButton } from '@/components/ui/signout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { User } from 'firebase/auth'
import Link from 'next/link'

interface HeaderProps {
  pathname: string
  user: User | null
  mobileOpen: boolean
  toggleMobileOpen: () => void
  setMobileOpen: (value: boolean) => void
}

export const Topbar = ({ pathname, user, mobileOpen, toggleMobileOpen, setMobileOpen }: HeaderProps) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-background/80 bg-slate-100/60 backdrop-blur-2xl dark:bg-slate-700/25',
        {
          'border-sky-950/20': pathname.includes('entry')
        }
      )}>
      <div className='mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4 md:px-6'>
        <Link href='/' className='flex min-w-0 items-center gap-2'>
          <div className='relative inline-flex size-11 items-center justify-center rounded-2xl sm:size-12'>
            <Icon name='squircle' className='absolute top-0 h-9 w-9 text-primary sm:h-10 sm:w-10' />
            <Icon name='golf-tee' className='relative size-6.5 text-white sm:size-7.5' />
          </div>
          <span className='hidden font-poly font-bold text-xl tracking-tight sm:inline xl:text-2xl'>Foreplay</span>
        </Link>

        <Navbar pathname={pathname} />

        <div className='flex items-center gap-2'>
          <div className='hidden sm:block'>
            <ThemeToggle />
          </div>
          <div className='relative z-60 flex items-center gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant='ghost' size='default' className='w-auto shrink-0 gap-2 px-3'>
                    <div className='flex size-5 items-center justify-center rounded-full bg-primary/10'>
                      <Avatar size='sm'>
                        <AvatarImage src={user?.photoURL ?? '/vercel.svg'} alt='pfp' />
                        <AvatarFallback>{user?.displayName?.split(' ').shift()?.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <Icon name='chevron-down' className='size-2 opacity-60' />
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

            <Button variant='ghost' size='icon' className='shrink-0 md:hidden' onClick={toggleMobileOpen}>
              <Icon name={mobileOpen ? 'close' : 'menu'} className='size-4' />
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen ? <MobileNav pathname={pathname} onNavigate={() => setMobileOpen(false)} /> : null}
    </header>
  )
}

export function MobileNav({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <div className='space-y-1 border-t bg-card/95 px-3 py-3 shadow-lg backdrop-blur md:hidden sm:px-4'>
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.value)
        return (
          <Link
            key={item.value}
            href={item.value}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
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
  )
}
