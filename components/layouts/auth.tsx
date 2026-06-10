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
    <div className='min-h-screen flex items-start justify-center bg-linear-to-t from-primary/15 via-30% via-primary/10 to-transparent pt-8 2xl:pt-24 px-4 relative'>
      <div className="absolute w-screen h-screen z-40 top-0 inset-0 bg-[url('/noise.svg')] opacity-80 scale-100 pointer-events-none" />
      <div className='w-full max-w-md relative z-50'>
        <div className='flex items-center space-x-4 xl:space-x-5 mb-5 xl:mb-10'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl relative'>
            <Icon name='squircle' className='w-14 h-14 text-primary absolute top-0' />
            <Icon name={icon} className='size-8 text-white relative' aria-hidden='true' />
          </div>
          <div className=' h-12'>
            <h1 className='text-2xl xl:text-2xl font-bold tracking-tight text-foreground leading-none'>{title}</h1>
            {subtitle && <p className='font-sans text-sm text-muted-foreground tracking-tight leading-4'>{subtitle}</p>}
          </div>
        </div>
        <div className='bg-background rounded-2xl shadow-xs border border-border p-7 xl:px-8 xl:py-10'>{children}</div>
        {footer && <p className='text-center text-sm text-muted-foreground mt-5 xl:mt-6'>{footer}</p>}
      </div>
    </div>
  )
}
