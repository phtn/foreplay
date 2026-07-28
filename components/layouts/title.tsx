import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SectionTitleProps {
  title?: string
  eyebrow?: string
  icon?: IconName
  href?: string
}

export const SectionTitle = ({ title, eyebrow, href }: SectionTitleProps) => {
  return (
    <div className='flex items-start justify-between'>
      <div className={href ? '_-space-y-2' : ''}>
        {href ? (
          <Link
            href={href}
            prefetch='auto'
            className='font-okx group inline-flex items-center gap-0.5 md:gap-2 text-sm text-foreground hover:underline underline-offset-4 decoration-0.5 decoration-dotted dark:hover:decoration-sky-400 md:tracking-wider hover:text-sky-700 dark:hover:text-foreground'>
            <Icon
              name='chevron-right'
              className='size-4 -mb-0.5 rotate-90 text-sky-500 group-hover:text-sky-600 dark:group-hover:text-sky-400'
            />
            <span>{eyebrow}</span>
          </Link>
        ) : (
          <p className='font-ios text-xs uppercase tracking-wider text-sky-600 dark:text-sky-500'>{eyebrow}</p>
        )}
        {title ? (
          <h2 className={cn('font-poly font-semibold text-base', { 'text-sm opacity-80': href })}>{title}</h2>
        ) : (
          <p className='opacity-0 font-poly font-medium text-base sm:text-lg md:text-xl'>X</p>
        )}
      </div>
    </div>
  )
}

export const LinkTitle = ({ title, eyebrow, icon, href }: SectionTitleProps) => {
  return (
    <div>
      <div className='flex gap-2 md:gap-4 items-start justify-between'>
        <Link
          href={href ?? ''}
          className='font-okx group inline-flex items-center gap-0.5 md:gap-2 text-sm text-foreground hover:underline underline-offset-4 decoration-0.5 decoration-dotted dark:hover:decoration-sky-400 md:tracking-wider hover:text-sky-700 dark:hover:text-foreground'>
          {icon && (
            <Icon
              name={icon}
              className='size-3.5 md:size-4 opacity-80 dark:group-hover:opacity-100 dark:group-hover:text-foreground'
            />
          )}
          <span>{eyebrow}</span>
          {href && (
            <Icon
              name='chevron-right'
              className='size-4 -mb-0.5 text-sky-500 group-hover:text-sky-700 dark:group-hover:text-sky-300'
            />
          )}
        </Link>
      </div>
      {title ? (
        <h2 className={cn('font-poly font-semibold text-base', { 'text-sm opacity-80': href })}>{title}</h2>
      ) : (
        <p className='opacity-0 font-poly font-medium text-base sm:text-xl md:text-xl'>X</p>
      )}
    </div>
  )
}
