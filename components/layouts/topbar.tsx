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
  setMobileOpen: (value: boolean) => void
}

export const Topbar = ({ pathname, user, mobileOpen, setMobileOpen }: HeaderProps) => {
  return (
    <header
      className={cn(
        'sticky border-b border-background top-0 z-50 bg-slate-100/60 dark:bg-slate-700/25 backdrop-blur-2xl ',
        {
          '  border-sky-950/20': pathname.includes('entry')
        }
      )}>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between pt-3 px-4 md:px-6'>
        <Link href='/' className='flex items-center gap-2'>
          <div className='relative inline-flex h-12 w-12 items-center justify-center rounded-2xl'>
            <Icon name='squircle' className='absolute top-0 h-10 w-10 text-primary' />
            <Icon name='golf-tee' className='relative size-7.5 text-white' />
          </div>
          <span className='hidden font-poly font-bold text-xl tracking-tight sm:inline xl:text-2xl'>Foreplay</span>
        </Link>

        <Navbar pathname={pathname} />

        <div className='flex items-center space-x-2'>
          <ThemeToggle />
          <div className='flex items-center gap-2 relative z-60'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant='ghost' size='default' className='gap-2'>
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

            <Button variant='ghost' size='icon' className='md:hidden' onClick={undefined}>
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
    <div className='md:hidden border-t bg-card px-4 py-3 space-y-1'>
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.value)
        return (
          <Link
            key={item.value}
            href={item.value}
            onClick={onNavigate}
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
  )
}
