import { Brand } from '@/components/layouts/brand'
import { SignOutButton } from '@/components/ui/signout'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className='max-w-7xl mx-auto flex flex-col md:gap-8 lg:p-8'>
        <header className='flex h-16 md:rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Brand />
            <p className='font-ios text-sm uppercase tracking-widest text-pink-500 dark:text-pink-400'>Admin</p>
          </div>

          <div className='flex items-center gap-3 self-start sm:self-center'>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
