'use client'

import { Loader } from '@/components/loaders/px-grid'
import { Typewrite } from '@/components/text/typewriter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { gen } from '@/utils/generators'
import { usePathname, useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo } from 'react'
import { NewEntryForm } from './entry-form'

const defaultPlayers = 2
const defaultDivision = 'Pro'

export const Content = () => {
  const path = usePathname()
  const routeTourId = path.split('/')[2]
  const generatedFormId = useMemo(() => gen(10), [])
  const router = useRouter()
  const [query, setQuery] = useQueryStates(
    {
      tourId: parseAsString,
      formId: parseAsString,
      players: parseAsInteger,
      division: parseAsString
    },
    { history: 'replace', shallow: true }
  )

  const tourId = query.tourId ?? routeTourId
  const formId = query.formId ?? generatedFormId
  const players = query.players ?? defaultPlayers
  const division = query.division ?? defaultDivision

  useEffect(() => {
    void setQuery((current) => {
      const next: Partial<typeof current> = {}

      if (current.tourId !== routeTourId) {
        next.tourId = routeTourId
      }

      if (!current.formId) {
        next.formId = generatedFormId
      }

      if (current.players == null) {
        next.players = defaultPlayers
      }

      if (!current.division) {
        next.division = defaultDivision
      }

      return Object.keys(next).length ? next : null
    })
  }, [generatedFormId, routeTourId, setQuery])

  const handlePlayersChange = (nextPlayers: number) => {
    void setQuery({ players: Math.max(1, nextPlayers) })
  }

  const handleDivisionChange = (nextDivision: string) => {
    void setQuery({ division: nextDivision })
  }

  return (
    <main>
      <div className='text-xl relative font-poly h-20 flex items-center gap-2'>
        <div className='size-6 aspect-square flex items-center justify-center rounded-full -rotate-45'>
          <Loader />
          <div className='size-5 bg-linear-to-tl from-white/30 via-background via-62% to-background rounded-full aspect-square absolute'></div>
        </div>

        {/*<div className='h-16 flex items-center -space-x-2.25'>
          <span className='text-xl 5 -mb-0.5'>|</span>
          <Icon name='chevron-down' className='size-6 opacity-100 -rotate-45 text-sky-500' />
        </div>*/}
        <Typewrite text='New Entry' speed={20} showCursor={false} className='text-sky-500' />
        {/*<span>New Entry</span>*/}
      </div>
      <Card className='relative my-auto w-full max-w-7xl border-border bg-slate-200/20 rounded-lg shadow-md py-6'>
        <CardContent className='px-5'>
          {tourId ? (
            <>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <p className='text-xs font-medium uppercase tracking-widest text-sky-600'>
                    MT MALArayat Golf & Country Club
                  </p>
                  <h2 id='book-now-title' className='font-heading text-xl font-bold tracking-tight sm:text-2xl'>
                    Seoul of Manila &middot; <span className='px-2 font-medium uppercase'>{formId}</span>
                  </h2>

                  {/*<p className='text-sm text-muted-foreground'>
                    {id} · {id} · {id}
                  </p>*/}
                </div>
                <div className='flex items-center space-x-8 bg-white border border-sky-700/8 rounded-md px-1.25 shadow-inner shadow-foreground/5'>
                  <div className='px-1.5 py-0.5 space-y-1.5'>
                    <p className='font-ios text-xs text-muted-foreground tracking-wide'>
                      Max: <strong>{200}</strong>
                    </p>
                  </div>
                  <div className='bg-lime-300/15 min-w-24  px-2.5 py-0.5 border border-lime-500/50 space-y-1.5 rounded-sm'>
                    <p className='font-ios text-muted-foreground text-xs tracking-wide'>T-5:00</p>
                  </div>
                  <div className='px-1.5 py-0.5 border border-foreground/0 space-y-1.5 rounded-lg'>
                    <p className='font-ios text-muted-foreground text-xs tracking-wide'>Tee time: 5:00AM</p>
                  </div>
                </div>
                <div className='grid gap-8 sm:grid-cols-3'>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>Price</p>
                    <p className='mt-1 text-base font-semibold'>{5000}</p>
                  </div>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>Total</p>
                    <p className='mt-1 text-base font-semibold'>{}</p>
                  </div>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>Players</p>
                    <p className='mt-1 text-base font-semibold'>{players}</p>
                  </div>
                </div>
              </div>

              <div className='h-2 bg-slate-200 border-y border-slate-300 rounded-xs mt-6 -mx-6'></div>
              <NewEntryForm
                key={formId}
                tourId={tourId}
                formId={formId}
                players={players}
                division={division}
                onPlayersChange={handlePlayersChange}
                onDivisionChange={handleDivisionChange}
              />
            </>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-primary/80'>Request received</p>
                  <h2 className='font-heading text-2xl font-bold tracking-tight sm:text-3xl'>You’re on the list</h2>
                  <p className='text-sm text-muted-foreground'>
                    We’ve captured your booking request for {tourId}. Finish payment to lock the slot.
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
      <div className='h-16 flex items-center justify-center'>
        <div className='bg-slate-200 w-20 rounded-md h-3'></div>
      </div>
      <div className='h-64 grid grid-cols-3'>
        <div className='w-full p-5'>
          <div className='rounded-3xl bg-slate-100/70 size-full'></div>
        </div>
        <div className='w-full'>
          <div className='rounded-3xl bg-slate-100 size-full'></div>
        </div>
        <div className='w-full p-5'>
          <div className='rounded-3xl bg-slate-100/70 size-full'></div>
        </div>
      </div>
    </main>
  )
}
