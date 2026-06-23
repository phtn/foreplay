import { Brand } from '@/components/layouts/brand'
import { SignOutButton } from '@/components/ui/signout'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className='max-w-7xl mx-auto flex flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8'>
        <header className='flex flex-col h-16 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Brand />
            <p className='font-ios text-sm uppercase tracking-widest text-pink-500 dark:text-pink-400'>Admin</p>
          </div>

          <div className='font-ios opacity-70'>
            <Link href='/admin/events'>events</Link>
          </div>

          <div className='flex items-center gap-3 self-start sm:self-center'>
            <ThemeToggle />
            {/*<Link href={routeContext.appHomeHref} className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}>
                    <Icon name='close' />
                  </Link>*/}
            <SignOutButton />
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
