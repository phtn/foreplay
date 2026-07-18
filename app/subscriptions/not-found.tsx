import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function SubscriptionNotFound() {
  return (
    <section className='mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center gap-5 px-4 text-center'>
      <div className='flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <Icon name='ticket' className='size-5' />
      </div>
      <div className='space-y-2'>
        <h1 className='font-poly text-2xl text-foreground'>Entry unavailable</h1>
        <p className='text-sm leading-6 text-muted-foreground'>
          This entry does not exist or is not available for the current account.
        </p>
      </div>
      <Link href='/subscriptions' className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
        <Icon name='arrow-left' className='size-4' />
        Back to entries
      </Link>
    </section>
  )
}
