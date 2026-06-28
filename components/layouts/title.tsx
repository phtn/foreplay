import { Icon, type IconName } from '@/lib/icons'
import Link from 'next/link'

interface SectionTitleProps {
  title: string
  eyebrow?: string
  icon?: IconName
  href?: string
}

export const SectionTitle = ({ title, eyebrow }: SectionTitleProps) => {
  return (
    <div className='flex gap-4 items-start justify-between'>
      <div>
        <p className='font-ios text-xs uppercase tracking-wider text-sky-600 dark:text-sky-500'>{eyebrow}</p>
        <h2 className='font-okx font-semibold tracking-wide text-xl'>{title}</h2>
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
          <h2 className='font-okx font-semibold tracking-wide text-xl'>{title}</h2>
          {icon && <Icon name={icon} className='size-4 md:size-5 -mb-1 text-sky-600 dark:text-sky-500' />}
        </div>
      </Link>
    </div>
  )
}
