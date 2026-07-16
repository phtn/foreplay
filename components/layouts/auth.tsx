import { Icon, IconName } from '@/lib/icons'
import { type ReactNode } from 'react'
import { ThemeToggle } from '../ui/theme-toggle'

interface AuthLayoutProps {
  icon: IconName
  title: string
  children: ReactNode
  subtitle?: string
  footer?: ReactNode
}
export const AuthLayout = ({ icon, title, subtitle, footer, children }: AuthLayoutProps) => {
  return (
    <div className='relative flex min-h-dvh items-start justify-center bg-linear-to-t from-primary/0 via-30% via-primary/0 to-primary/0 px-2 md:px-4 py-4 sm:py-6 md:py-10 2xl:py-16'>
      <div className='relative z-50 w-full max-w-md'>
        <div className='mb-5 flex space-x-2 xl:mb-8 xl:space-x-5'>
          <div className='portrait:px-4 relative inline-flex size-14 items-center justify-center rounded-2xl sm:size-16'>
            <Icon name='squircle' className='absolute top-0 size-12 text-primary sm:size-14' />
            <Icon name={icon} className='relative size-7 text-white sm:size-8' aria-hidden='true' />
          </div>
          <div className='w-full h-14 flex flex-col justify-center'>
            <h1 className='text-lg font-poly font-medium leading-none tracking-tight text-foreground xl:text-xl'>
              {title}
            </h1>
            {subtitle && <p className='font-sans text-sm text-muted-foreground tracking-tight leading-4'>{subtitle}</p>}
          </div>

          <div className='size-14 flex items-center'>
            <ThemeToggle />
          </div>
        </div>
        <div className='overflow-hidden rounded-3xl border border-border/15 bg-white shadow-xs dark:bg-white/30'>
          <div className='relative bg-primary/2 p-5 sm:p-6 xl:px-8 xl:py-10 dark:bg-primary/10'>
            <div className="pointer-events-none absolute inset-0 z-40 h-full w-full bg-[url('/noise.svg')] opacity-10" />
            {children}
          </div>
        </div>
        <div className='mt-5 flex h-auto w-full items-start justify-between gap-4 sm:flex-row sm:items-center xl:mt-6'>
          {footer && <div className='md:text-sm text-xs text-muted-foreground'>{footer}</div>}
        </div>
      </div>
    </div>
  )
}
