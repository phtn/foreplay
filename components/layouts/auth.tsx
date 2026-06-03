import { Icon, IconName } from '@/lib/icons'
import { type ReactNode } from 'react'

interface AuthLayoutProps {
  icon: IconName
  title: string
  children: ReactNode
  subtitle?: string
  footer?: ReactNode
}
export const AuthLayout = ({ icon, title, subtitle, footer, children }: AuthLayoutProps) => {
  return (
    <div className='min-h-screen flex items-start justify-center bg-primary/5 pt-8 xl:pt-24 px-4'>
      <div className='w-full max-w-md'>
        <div className='flex items-center space-x-4 xl:space-x-5 mb-5 xl:mb-10'>
          <div className='inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary'>
            <Icon name={icon} className='size-6 text-primary-foreground' aria-hidden='true' />
          </div>
          <div>
            <h1 className='text-2xl xl:text-3xl font-bold tracking-tight text-foreground'>{title}</h1>
            {subtitle && <p className='font-sans text-muted-foreground tracking-tight xl:mt-1'>{subtitle}</p>}
          </div>
        </div>
        <div className='bg-background rounded-2xl shadow-xs border border-border p-7 xl:p-8'>{children}</div>
        {footer && <p className='text-center text-sm text-muted-foreground mt-5 xl:mt-6'>{footer}</p>}
      </div>
    </div>
  )
}
