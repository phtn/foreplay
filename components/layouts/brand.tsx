import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import Link from 'next/link'

interface BrandProps {
  className?: ClassName
}

export function Brand({ className }: BrandProps) {
  return (
    <Link href='/tournaments/som-2026' className='flex min-w-0 items-center md:gap-2'>
      <div className='relative inline-flex size-10 sm:size-11 md:size-12 items-center justify-center rounded-2xl'>
        <Icon name='squircle' className='absolute top-0 w-8 h-8 sm:h-9 sm:w-9 text-primary md:h-10 md:w-10' />
        <Icon name='golf-tee' className='relative size-5.5 text-white sm:size-6.5 md:size-7.5' />
      </div>
      <span className={cn('font-poly font-bold text-lg md:text-xl tracking-tight sm:inline xl:text-2xl', className)}>
        Foreplay
      </span>
    </Link>
  )
}
