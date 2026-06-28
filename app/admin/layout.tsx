import { Brand } from '@/components/layouts/brand'
import { SignOutButton } from '@/components/ui/signout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Icon } from '@/lib/icons'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className='max-w-7xl mx-auto flex flex-col md:gap-8 lg:p-8'>
        <header className='flex h-16 md:rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center justify-between'>
          <div className='flex items-center gap-3 md:gap-5'>
            <Brand />
            <Link
              href='/admin/config'
              className='font-ios text-xs md:text-sm uppercase md:tracking-widest text-pink-500 dark:text-pink-400'>
              Admin
            </Link>
          </div>

          <div className='flex items-center gap-4 self-start sm:self-center'>
            <Link href='/admin/scanner' className='inline-flex h-10 items-center gap-2 px-2'>
              <Icon name='code-scanner' className='size-4 opacity-80' />
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
