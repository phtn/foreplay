import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import Link from 'next/link'

interface BrandProps {
  className?: ClassName
}

export function Brand({ className }: BrandProps) {
  return (
    <Link href='/' className='flex min-w-0 items-center gap-2'>
      <div className='relative inline-flex size-11 items-center justify-center rounded-2xl sm:size-12'>
        <Icon name='squircle' className='absolute top-0 h-9 w-9 text-primary sm:h-10 sm:w-10' />
        <Icon name='golf-tee' className='relative size-6.5 text-white sm:size-7.5' />
      </div>
      <span className={cn('hidden font-poly font-bold text-xl tracking-tight sm:inline xl:text-2xl', className)}>
        Foreplay
      </span>
    </Link>
  )
}
