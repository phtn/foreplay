'use client'

import { Typewrite } from '@/components/text/typewriter'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { NewEntryForm } from './entry-form'

const defaultPlayers = 2

type DivisionOption = {
  label: string
  value: string
  amount: number
}

interface ContentProps {
  tourId: string
  initialFormId: string
  initialDivision: string
  initialEmail: string
  initialPhone: string
  tournament: {
    title: string
    venue: string
    gateOpenAt: number | null
    entryFee: number
    entryFeeLabel: string
    divisionOptions: DivisionOption[]
  }
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency'
})

function formatCountdown(targetAt: number | null) {
  if (!targetAt) {
    return 'TBD'
  }

  const diff = Math.max(0, targetAt - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const time = [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')

  return days > 0 ? `${days}d ${time}` : time
}

export const Content = ({
  tourId,
  initialFormId,
  initialDivision,
  initialEmail,
  initialPhone,
  tournament
}: ContentProps) => {
  const [countdownLabel, setCountdownLabel] = useState('...')
  const validDivisionValues = useMemo(
    () => new Set(tournament.divisionOptions.map((option) => option.value)),
    [tournament.divisionOptions]
  )
  const [query, setQuery] = useQueryStates(
    {
      tourId: parseAsString,
      formId: parseAsString,
      players: parseAsInteger,
      division: parseAsString
    },
    { history: 'replace', shallow: true }
  )

  const formId = query.formId ?? initialFormId
  const players = query.players ?? defaultPlayers
  const division = query.division && validDivisionValues.has(query.division) ? query.division : initialDivision
  // const selectedDivisionOption = tournament.divisionOptions.find((option) => option.value === division)
  // const price = selectedDivisionOption?.amount ?? tournament.entryFee
  const price = 5000
  const total = players * price

  useEffect(() => {
    void setQuery((current) => {
      const next: Partial<typeof current> = {}

      if (current.tourId !== tourId) {
        next.tourId = tourId
      }

      if (!current.formId) {
        next.formId = initialFormId
      }

      if (current.players == null) {
        next.players = defaultPlayers
      }

      if (!current.division || !validDivisionValues.has(current.division)) {
        next.division = initialDivision
      }

      return Object.keys(next).length ? next : null
    })
  }, [initialDivision, initialFormId, setQuery, tourId, validDivisionValues])

  useEffect(() => {
    const updateCountdown = () => {
      setCountdownLabel(formatCountdown(tournament.gateOpenAt))
    }
    const timeoutId = window.setTimeout(updateCountdown, 0)
    const intervalId = window.setInterval(updateCountdown, 1000)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [tournament.gateOpenAt])

  const handlePlayersChange = (nextPlayers: number) => {
    void setQuery({ players: Math.max(1, nextPlayers) })
  }

  const handleDivisionChange = (nextDivision: string) => {
    void setQuery({ division: nextDivision })
  }

  return (
    <main className='space-y-6 pb-6 sm:space-y-8'>
      <div className='relative flex items-center gap-2 text-xl font-poly'>
        <Icon name='tag-arrow' className='size-6 text-sky-500 mb-0.5' />

        <div className='flex items-center space-x-4'>
          <Typewrite text='New Entry' speed={20} showCursor={false} className='text-sky-500' />
          <Icon name='chevron-right' className='size-5 text-slate-500' />
          <Typewrite
            text={tournament.title}
            speed={15}
            showCursor={false}
            className='font-light text-slate-900 dark:text-foreground capitalize'
            initialDelay={250}
          />
          <Icon name='chevron-right' className='size-5 text-slate-500' />
          <Typewrite
            text={formId}
            speed={15}
            showCursor={false}
            className='text-slate-500/50 uppercase font-light'
            initialDelay={500}
          />
        </div>
      </div>
      <Card className='relative w-full max-w-7xl rounded-lg border border-slate-300 dark:border-background dark:bg-slate-700 bg-slate-200/20 shadow-md shadow-slate-100 dark:shadow-none p-0'>
        <CardContent className='p-0'>
          {tourId ? (
            <>
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border-b'>
                <div className='space-y-1'>
                  <p className='text-xs font-medium uppercase tracking-widest text-sky-600'>Venue</p>
                  <h2 id='book-now-title' className='font-heading text-xl font-bold tracking-tight sm:text-2xl'>
                    {tournament.venue}
                  </h2>
                </div>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-8'>
                  <div className='p-0 space-y-1.5'>
                    <p className='font-ios text-xs uppercase tracking-wide dark:text-slate-400'>Price</p>
                    <p className='font-okx font-semibold mt-1 text-base'>
                      {price > 0 ? currencyFormatter.format(price) : tournament.entryFeeLabel}
                    </p>
                  </div>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-wide dark:text-slate-400'>Total</p>
                    <p className='font-okx font-semibold mt-1 text-base'>{currencyFormatter.format(total)}</p>
                  </div>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-wide dark:text-slate-400'>Players</p>
                    <p className='font-okx font-semibold mt-1 text-base'>{players}</p>
                  </div>
                </div>
                {/* Countdown */}
                <div className='flex items-start h-12 bg-slate-100 dark:bg-transparent'>
                  <div className='min-w-24 bg-sky-200/5 rounded-md px-4 py-2'>
                    <div className='flex items-center space-x-2 font-ios text-sky-600 dark:text-sky-500 text-base md:text-lg tracking-wide leading-none whitespace-nowrap'>
                      <span className='font-poly font-bold text-slate-400/80 text-base mt-0.5 tracking-widest'>T-</span>
                      <span aria-live='polite'>{countdownLabel}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='h-2 rounded-xs border-y border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 -mx-4 sm:-mx-5' />
              <NewEntryForm
                key={formId}
                tourId={tourId}
                formId={formId}
                players={players}
                division={division}
                initialEmail={initialEmail}
                initialPhone={initialPhone}
                divisionOptions={tournament.divisionOptions}
                onPlayersChange={handlePlayersChange}
                onDivisionChange={handleDivisionChange}
              />
            </>
          ) : (
            <div className='space-y-4'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='space-y-1'>
                  <p className='text-xs font-semibold uppercase tracking-[0.24em] text-primary/80'>Preparing entry</p>
                  <h2 className='font-heading text-2xl font-bold tracking-tight sm:text-3xl'>Creating your request</h2>
                  <p className='text-sm text-muted-foreground'>
                    We’re preparing a reference number for this tournament entry.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className='flex h-16 items-center justify-center'>
        <div className='h-3 w-20 rounded-md bg-slate-200 dark:bg-slate-800/15' />
      </div>
      <div className='hidden h-64 grid-cols-3 md:grid opacity-50'>
        <div className='w-full p-5'>
          <div className='size-full rounded-3xl bg-slate-100/70 dark:bg-slate-800/10' />
        </div>
        <div className='w-full'>
          <div className='size-full rounded-3xl bg-slate-100 dark:bg-slate-800/10' />
        </div>
        <div className='w-full p-5'>
          <div className='size-full rounded-3xl bg-slate-100/70 dark:bg-slate-800/10' />
        </div>
      </div>
    </main>
  )
}
