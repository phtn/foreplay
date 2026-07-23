import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function UserNotFound() {
  return (
    <main className='mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-5 text-center'>
      <div className='flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <Icon name='user' className='size-6' />
      </div>
      <p className='mt-6 font-ios text-[10px] uppercase tracking-[0.24em] text-muted-foreground'>User not found</p>
      <h1 className='mt-2 font-poly text-2xl font-medium'>There is no account for this UID.</h1>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        Check the Firebase user ID and try again, or return to the user directory.
      </p>
      <Link href='/admin/config' className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 gap-2 rounded-full')}>
        <Icon name='arrow-left' className='size-4' />
        Back to users
      </Link>
    </main>
  )
}
