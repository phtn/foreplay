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
    <div className='min-h-screen flex items-start justify-center bg-linear-to-t from-primary/5 via-30% via-primary/3 to-primary/2 pt-8 2xl:pt-24 px-4 relative'>
      <div className='w-full max-w-md relative z-50'>
        <div className='flex space-x-4 xl:space-x-5 mb-5 xl:mb-10'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl relative'>
            <Icon name='squircle' className='size-14 text-primary top-0 absolute' />
            <Icon name={icon} className='size-8 relative text-white' aria-hidden='true' />
          </div>
          <div className='flex flex-col justify-center h-14'>
            <h1 className='text-2xl xl:text-2xl font-bold tracking-tight text-foreground leading-none'>{title}</h1>
            {subtitle && <p className='font-sans text-sm text-muted-foreground tracking-tight leading-4'>{subtitle}</p>}
          </div>
        </div>
        <div className='bg-white dark:bg-white/30 rounded-4xl border border-primary/60 shadow-xs overflow-hidden'>
          <div className='dark:bg-primary/10 bg-primary/15 p-7 xl:px-8 xl:py-10 relative'>
            <div className="absolute w-full h-full z-40 top-0 inset-0 bg-[url('/noise.svg')] opacity-10 pointer-events-none" />
            {children}
          </div>
        </div>
        <div className='flex items-center justify-between mt-5 xl:mt-6 h-12 w-full'>
          {footer && <div className='text-center text-sm text-muted-foreground'>{footer}</div>}
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
