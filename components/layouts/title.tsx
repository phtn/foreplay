import { Icon, type IconName } from '@/lib/icons'
import Link from 'next/link'

interface SectionTitleProps {
  title: string
  eyebrow?: string
  icon?: IconName
  href?: string
}

export const SectionTitle = ({ title, eyebrow, href }: SectionTitleProps) => {
  return (
    <div className='flex items-start justify-between'>
      <div className={href ? '-space-y-2' : ''}>
        {href ? (
          <Link
            href='/admin'
            prefetch='auto'
            className='font-okx group inline-flex items-center gap-0.5 md:gap-2 text-sm text-foreground hover:underline underline-offset-4 decoration-0.5 decoration-dashed md:tracking-wider hover:text-sky-600 leading-none'>
            <Icon name='chevron-down' className='size-4 rotate-45 text-sky-500 group-hover:text-sky-600' />
            {eyebrow}
          </Link>
        ) : (
          <p className='font-ios text-xs uppercase tracking-wider text-sky-600 dark:text-sky-500'>{eyebrow}</p>
        )}

        <h2 className='font-poly font-semibold text-base md:text-base'>{title}</h2>
      </div>
    </div>
  )
}

export const LinkTitle = ({ title, eyebrow, icon, href }: SectionTitleProps) => {
  return (
    <div className='flex gap-4 items-start justify-between'>
      <Link href={href ?? ''}>
        <p className='font-ios text-xs uppercase tracking-wider text-sky-600 dark:text-sky-500'>{eyebrow}</p>
        <div className='flex items-center space-x-1'>
          <h2 className='font-poly flex items-center gap-1 md:gap-2'>{title}</h2>
          {icon && <Icon name={icon} className='size-4 text-sky-600 dark:text-sky-500' />}
        </div>
      </Link>
    </div>
  )
}
