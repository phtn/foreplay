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
  const entryFee = 5000
  const total = players * entryFee

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
    <main className='space-y-6 pb-6 sm:space-y-8'>
      <div className='relative flex items-center gap-2 text-xl font-poly'>
        <div className='relative flex size-6 aspect-square items-center justify-center rounded-full -rotate-45'>
          <Loader />
          <div className='absolute size-5 aspect-square rounded-full bg-linear-to-tl from-white/30 via-background via-62% to-background' />
        </div>
        <Typewrite text='New Entry' speed={20} showCursor={false} className='text-sky-500' />
      </div>
      <Card className='relative w-full max-w-7xl rounded-lg border-slate-400 bg-slate-200/20 py-6 shadow-md shadow-slate-100'>
        <CardContent className='px-4 sm:px-5'>
          {tourId ? (
            <>
              <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
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
                <div className='flex flex-wrap items-center gap-3 rounded-md border border-sky-700/8 bg-white px-3 py-2 shadow-inner shadow-foreground/5'>
                  <div className='space-y-1.5'>
                    <p className='font-ios text-xs text-muted-foreground tracking-wide'>
                      Max: <strong>{200}</strong>
                    </p>
                  </div>
                  <div className='min-w-24 rounded-sm border border-lime-500/50 bg-lime-300/15 px-2.5 py-0.5'>
                    <p className='font-ios text-muted-foreground text-xs tracking-wide'>T-5:00</p>
                  </div>
                  <div className='space-y-1.5 rounded-lg border border-foreground/0 px-1.5 py-0.5'>
                    <p className='font-ios text-muted-foreground text-xs tracking-wide'>Tee time: 5:00AM</p>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-8'>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>Price</p>
                    <p className='mt-1 text-base font-semibold'>{entryFee}</p>
                  </div>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>Total</p>
                    <p className='mt-1 text-base font-semibold'>{total}</p>
                  </div>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-wide text-muted-foreground'>Players</p>
                    <p className='mt-1 text-base font-semibold'>{players}</p>
                  </div>
                </div>
              </div>

              <div className='mt-6 h-2 rounded-xs border-y border-slate-300 bg-slate-200 -mx-4 sm:-mx-5' />
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
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
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
                  className='w-full sm:w-auto'
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
      <div className='flex h-16 items-center justify-center'>
        <div className='h-3 w-20 rounded-md bg-slate-200' />
      </div>
      <div className='hidden h-64 grid-cols-3 md:grid'>
        <div className='w-full p-5'>
          <div className='size-full rounded-3xl bg-slate-100/70' />
        </div>
        <div className='w-full'>
          <div className='size-full rounded-3xl bg-slate-100' />
        </div>
        <div className='w-full p-5'>
          <div className='size-full rounded-3xl bg-slate-100/70' />
        </div>
      </div>
    </main>
  )
}
