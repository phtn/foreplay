'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Icon } from '@/lib/icons'
import { Input } from '@base-ui/react'
import { usePathname, useRouter } from 'next/navigation'

export const Content = () => {
  const path = usePathname()
  const id = path.split('/')[2]
  const router = useRouter()
  return (
    <main>
      <div className='text-xl font-poly h-16 flex items-center space-x-2'>
        <Icon name='chevrons-right' className='size-6 opacity-70' />
        <span>Register</span>
      </div>
      <Card className='relative my-auto w-full max-w-7xl border-border bg-sky-400/10 rounded-lg shadow-md py-8'>
        <CardContent className='px-8'>
          {id ? (
            <>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-sky-500'>MT MALArayat Golf</p>
                  <h2 id='book-now-title' className='font-heading text-xl font-bold tracking-tight sm:text-2xl'>
                    Seoul of Manila
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    {id} · {id} · {id}
                  </p>
                </div>
                <div className='grid gap-3 sm:grid-cols-4'>
                  <div className='rounded-2xl bg-muted/20 p-4'>
                    <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Entry fee</p>
                    <p className='mt-1 text-lg font-semibold'>{0}</p>
                  </div>
                  <div className='rounded-2xl bg-muted/20 p-4'>
                    <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Date</p>
                    <p className='mt-1 text-lg font-semibold'>{0}</p>
                  </div>
                  <div className='rounded-2xl bg-muted/20 p-4'>
                    <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Tee time</p>
                    <p className='mt-1 text-lg font-semibold'>{'5:30 AM'}</p>
                  </div>
                  <div className='rounded-2xl bg-muted/20 p-4'>
                    <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Capacity</p>
                    <p className='mt-1 text-lg font-semibold'>300</p>
                  </div>
                </div>
              </div>

              <div className='h-3 bg-slate-400/40 rounded mt-4'></div>
              <form
                className='grid gap-4 bg-white p-4'
                onSubmit={(event) => {
                  event.preventDefault()
                }}>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='book-full-name'>Full name</Label>
                    <Input
                      id='book-full-name'
                      value={''}
                      placeholder='Your name'
                      autoComplete='name'
                      autoFocus
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='book-email'>Email</Label>
                    <Input id='book-email' type='email' placeholder='you@example.com' autoComplete='email' required />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='book-phone'>Phone</Label>
                    <Input id='book-phone' placeholder='+63 9xx xxx xxxx' autoComplete='tel' required />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='book-division'>Division</Label>
                    <select
                      id='book-division'
                      className='h-9 w-full rounded-lg border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'>
                      {['Pro'].map((division) => (
                        <option key={division} value={division}>
                          {division}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='book-players'>Players</Label>
                    <Input id='book-players' type='number' min='1' max='4' required />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='book-handicap'>Handicap index</Label>
                    <Input id='book-handicap' placeholder='Optional' />
                  </div>
                </div>

                <div className='flex flex-wrap items-center justify-between gap-3 pt-2'>
                  <p className='text-sm text-muted-foreground'>
                    By continuing, you reserve a request for {id}. Confirmation follows payment review.
                  </p>
                  <div className='flex flex-wrap gap-3'>
                    <Button size='xl' type='submit'>
                      Continue registration
                    </Button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-primary/80'>Request received</p>
                  <h2 className='font-heading text-2xl font-bold tracking-tight sm:text-3xl'>You’re on the list</h2>
                  <p className='text-sm text-muted-foreground'>
                    We’ve captured your booking request for {id}. Finish payment to lock the slot.
                  </p>
                </div>
              </div>

              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                  <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Player</p>
                  <p className='mt-1 font-medium'>name</p>
                  <p className='text-sm text-muted-foreground'>email</p>
                </div>
                <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                  <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Next step</p>
                  <p className='mt-1 font-medium'>Upload payment and receive pairings</p>
                  <p className='text-sm text-muted-foreground'>Go to your entries to complete the flow.</p>
                </div>
              </div>

              <div className='flex flex-wrap justify-end gap-3'>
                <Button
                  type='button'
                  onClick={() => {
                    router.push('/entries')
                  }}>
                  View my entries
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
