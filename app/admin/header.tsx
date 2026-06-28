'use client'
import { Brand } from '@/components/layouts/brand'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SignOutButton } from '@/components/ui/signout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useToggle } from '@/hooks/use-toggle'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import Link from 'next/link'

export const AdminHeader = () => {
  const { user } = useFirebaseUser()
  const { on: mobileOpen, toggle: toggleMobileOpen } = useToggle(false)
  const avatarFallback = user?.displayName?.[0] ?? user?.email?.[0] ?? 'U'
  const avatarLabel = user?.displayName ?? user?.email ?? 'User avatar'
  return (
    <header className='flex h-16 ps-2 pe-6 backdrop-blur md:items-center justify-between'>
      <div className='flex items-center gap-2 md:gap-5'>
        <Brand />
        <Link
          href='/admin/config'
          className='font-ios text-xs md:text-sm uppercase md:tracking-widest text-pink-500 dark:text-pink-400'>
          Admin
        </Link>
      </div>

      <div className='flex items-center gap-4'>
        <Link href='/admin/scanner' className='inline-flex h-10 items-center gap-2 px-2'>
          <Icon name='code-scanner' className='size-5 opacity-80' />
        </Link>
        <div className='relative z-60 flex items-center gap-4'>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant='ghost' size='icon-sm' className='w-auto shrink-0 aspect-square rounded-full'>
                  <div className='flex size-5 items-center justify-center rounded-full bg-primary/10'>
                    <Avatar size='sm'>
                      {user?.photoURL ? <AvatarImage src={user.photoURL} alt={avatarLabel} /> : null}
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
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
    </header>
  )
}
