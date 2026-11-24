'use client'

import { Button } from '@/components/ui/button'
import { ConvexError } from 'convex/values'

export default function ReportsError({ error, reset }: { error: Error; reset: () => void }) {
  const message = error instanceof ConvexError && typeof error.data === 'string'
    ? error.data
    : 'Unable to load tournament reports. Try again.'
  return (
    <main className='mx-auto w-full max-w-6xl space-y-3 px-4 py-6'>
      <h1 className='font-poly text-2xl'>Tournament reports</h1>
      <p role='alert' className='text-sm text-muted-foreground'>{message}</p>
      <Button type='button' variant='outline' onClick={reset}>Try again</Button>
    </main>
  )
}
