'use client'

import { Icon } from '@/lib/icons'
import { useRouter } from 'next/navigation'

export default function BackButton({ label = '← Go Back' }: { label?: string }) {
  const router = useRouter()

  return (
    <button
      type='button'
      onClick={() => router.back()}
      className='group inline-flex items-center gap-1 rounded-full py-2 pl-2 font-okx text-sm text-muted-foreground transition-colors hover:text-foreground'>
      <Icon name='chevron-right' className='-rotate-90 text-sky-500 size-4' />
      {label}
    </button>
  )
}
