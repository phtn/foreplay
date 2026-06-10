'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type BookNowFormProps = {
  tournamentTitle: string
  venue: string
  dateLabel: string
  feeLabel: string
  divisionOptions: string[]
  teeTimeLabel?: string
  triggerClassName?: string
}

type FormState = {
  fullName: string
  email: string
  phone: string
  division: string
  handicapIndex: string
  playerCount: string
  notes: string
}

const initialState: FormState = {
  fullName: '',
  email: '',
  phone: '',
  division: 'Open',
  handicapIndex: '',
  playerCount: '1',
  notes: ''
}

const textareaClassName =
  'min-h-28 w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function BookNowForm({
  tournamentTitle,
  venue,
  dateLabel,
  feeLabel,
  divisionOptions,
  teeTimeLabel,
  triggerClassName
}: BookNowFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<FormState>(initialState)

  const divisions = useMemo(
    () => divisionOptions.filter(Boolean).filter((division, index, all) => all.indexOf(division) === index),
    [divisionOptions]
  )

  const reset = () => {
    setSubmitted(false)
    setForm(initialState)
  }

  const update =
    (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }))
    }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          reset()
        }
      }}>
      <Dialog.Trigger
        render={
          <Button
            type='button'
            size='xl'
            className={cn(
              'bg-foreground px-8 text-sm font-poly font-medium text-background hover:bg-foreground/90',
              triggerClassName
            )}>
            Book Now
          </Button>
        }
      />

      <Dialog.Portal>
        <Dialog.Backdrop
          className='fixed inset-0 z-80 bg-black/60 backdrop-blur-sm transition-opacity duration-300 data-closed:opacity-0 data-open:opacity-100'
          forceRender
        />
        <Dialog.Popup
          className='fixed inset-0 z-80 flex items-start justify-center overflow-y-auto px-4 py-8 outline-none sm:px-6 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
          initialFocus={true}
          finalFocus={true}
          aria-labelledby='book-now-title'>
          <Card className='relative my-auto w-full max-w-3xl border-border/70 bg-card shadow-[0_30px_90px_-30px_rgba(15,23,42,0.7)]'>
            <CardContent className='space-y-6 p-5 sm:p-6 lg:p-8'>
              {!submitted ? (
                <>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='space-y-1'>
                      <p className='text-xs font-semibold uppercase tracking-[0.24em] text-primary/80'>Reserve entry</p>
                      <h2 id='book-now-title' className='font-heading text-2xl font-bold tracking-tight sm:text-3xl'>
                        Book your tee time
                      </h2>
                      <p className='text-sm text-muted-foreground'>
                        {tournamentTitle} · {venue} · {dateLabel}
                      </p>
                    </div>
                    <Dialog.Close
                      render={
                        <Button type='button' variant='ghost' size='icon-sm' aria-label='Close booking form'>
                          ×
                        </Button>
                      }
                    />
                  </div>

                  <div className='grid gap-3 sm:grid-cols-4'>
                    <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Entry fee</p>
                      <p className='mt-1 text-lg font-semibold'>{feeLabel}</p>
                    </div>
                    <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Date</p>
                      <p className='mt-1 text-lg font-semibold'>{dateLabel}</p>
                    </div>
                    <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Tee time</p>
                      <p className='mt-1 text-lg font-semibold'>{'5:30 AM'}</p>
                    </div>
                    <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Capacity</p>
                      <p className='mt-1 text-lg font-semibold'>300</p>
                    </div>
                  </div>

                  <form
                    className='grid gap-4'
                    onSubmit={(event) => {
                      event.preventDefault()
                      setSubmitted(true)
                    }}>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='book-full-name'>Full name</Label>
                        <Input
                          id='book-full-name'
                          value={form.fullName}
                          onChange={update('fullName')}
                          placeholder='Your name'
                          autoComplete='name'
                          autoFocus
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='book-email'>Email</Label>
                        <Input
                          id='book-email'
                          type='email'
                          value={form.email}
                          onChange={update('email')}
                          placeholder='you@example.com'
                          autoComplete='email'
                          required
                        />
                      </div>
                    </div>

                    <div className='grid gap-4 md:grid-cols-3'>
                      <div className='space-y-2'>
                        <Label htmlFor='book-phone'>Phone</Label>
                        <Input
                          id='book-phone'
                          value={form.phone}
                          onChange={update('phone')}
                          placeholder='+63 9xx xxx xxxx'
                          autoComplete='tel'
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='book-division'>Division</Label>
                        <select
                          id='book-division'
                          value={form.division}
                          onChange={update('division')}
                          className='h-9 w-full rounded-lg border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'>
                          {divisions.map((division) => (
                            <option key={division} value={division}>
                              {division}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='book-players'>Players</Label>
                        <Input
                          id='book-players'
                          type='number'
                          min='1'
                          max='4'
                          value={form.playerCount}
                          onChange={update('playerCount')}
                          required
                        />
                      </div>
                    </div>

                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='book-handicap'>Handicap index</Label>
                        <Input
                          id='book-handicap'
                          value={form.handicapIndex}
                          onChange={update('handicapIndex')}
                          placeholder='Optional'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='book-notes'>Notes</Label>
                        <textarea
                          id='book-notes'
                          value={form.notes}
                          onChange={update('notes')}
                          placeholder='Preferred pairing, cart request, sponsor note...'
                          className={textareaClassName}
                        />
                      </div>
                    </div>

                    <div className='flex flex-wrap items-center justify-between gap-3 pt-2'>
                      <p className='text-sm text-muted-foreground'>
                        By continuing, you reserve a request for {tournamentTitle}. Confirmation follows payment review.
                      </p>
                      <div className='flex flex-wrap gap-3'>
                        <Dialog.Close
                          render={
                            <Button size='xl' type='button' variant='outline'>
                              Cancel
                            </Button>
                          }
                        />
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
                      <p className='text-xs font-semibold uppercase tracking-[0.24em] text-primary/80'>
                        Request received
                      </p>
                      <h2 className='font-heading text-2xl font-bold tracking-tight sm:text-3xl'>You’re on the list</h2>
                      <p className='text-sm text-muted-foreground'>
                        We’ve captured your booking request for {tournamentTitle}. Finish payment to lock the slot.
                      </p>
                    </div>
                    <Dialog.Close
                      render={
                        <Button type='button' variant='ghost' size='icon-sm' aria-label='Close confirmation'>
                          ×
                        </Button>
                      }
                    />
                  </div>

                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Player</p>
                      <p className='mt-1 font-medium'>{form.fullName}</p>
                      <p className='text-sm text-muted-foreground'>{form.email}</p>
                    </div>
                    <div className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Next step</p>
                      <p className='mt-1 font-medium'>Upload payment and receive pairings</p>
                      <p className='text-sm text-muted-foreground'>Go to your entries to complete the flow.</p>
                    </div>
                  </div>

                  <div className='flex flex-wrap justify-end gap-3'>
                    <Dialog.Close
                      render={
                        <Button type='button' variant='outline'>
                          Close
                        </Button>
                      }
                    />
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
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
