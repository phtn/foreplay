'use client'

import { Typewrite } from '@/components/text/typewriter'
import { Card, CardContent } from '@/components/ui/card'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { NewEntryForm } from './entry-form'

const defaultPlayers = 2

type DivisionOption = {
  label: string
  value: string
  amount: number
}

type Subscription = Doc<'subscriptions'>
type EntryStatus = 'pending_payment' | 'payment_review' | 'confirmed' | 'cancelled'

type PaymentMethod = {
  bankOrEwallet: string
  accountName: string
  accountNumber: string
  qrCodeContent: string | null
}

interface ContentProps {
  tourId: string
  initialFormId: string
  initialDivision: string
  initialEmail: string
  initialPhone: string
  initialSubscription: Subscription | null
  paymentMethod: PaymentMethod | null
  currentEntries: Subscription[]
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
  style: 'currency',
  currencyDisplay: 'code'
})

const statusStyles: Record<EntryStatus, string> = {
  pending_payment: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  payment_review: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  confirmed: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelled: 'border-destructive/25 bg-destructive/10 text-destructive'
}

const formatStatus = (value: EntryStatus) => {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const getEntryStatus = (subscription: Subscription): EntryStatus => {
  if (subscription.status === 'cancelled') {
    return 'cancelled'
  }

  if (subscription.payment_status === 'paid' || subscription.status === 'confirmed') {
    return 'confirmed'
  }

  if (subscription.status === 'payment_review') {
    return 'payment_review'
  }

  return 'pending_payment'
}

const getSummaryStatus = (entries: Subscription[]): EntryStatus => {
  const statuses = entries.map(getEntryStatus)

  if (statuses.includes('pending_payment')) {
    return 'pending_payment'
  }

  if (statuses.includes('payment_review')) {
    return 'payment_review'
  }

  if (statuses.includes('confirmed')) {
    return 'confirmed'
  }

  return 'cancelled'
}

const getEntryCount = (subscription: Subscription) => {
  const entries = Number.parseInt(subscription.status === 'pending_payment' ? subscription.total_players : '0', 10)
  return Number.isFinite(entries) && entries > 0 ? entries : 0
}

const getSubscriptionReference = (subscription: Subscription) => {
  return subscription.form_id ?? subscription.txn_ref_no ?? subscription._id
}

const getActiveUniqueEntries = (entries: Subscription[]) => {
  const activeEntries = entries.filter((entry) => getEntryStatus(entry) !== 'cancelled')
  return Array.from(new Map(activeEntries.map((entry) => [getSubscriptionReference(entry), entry])).values())
}

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
  initialSubscription,
  paymentMethod,
  currentEntries,
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

  const subscriptionPlayers = Number.parseInt(initialSubscription?.total_players ?? '', 10)
  const initialPlayers = Number.isFinite(subscriptionPlayers) ? Math.max(1, subscriptionPlayers) : defaultPlayers
  const formId = initialFormId
  const players = initialSubscription ? initialPlayers : (query.players ?? defaultPlayers)
  const division = initialSubscription
    ? (initialSubscription.division ?? initialDivision)
    : query.division && validDivisionValues.has(query.division)
      ? query.division
      : initialDivision
  // const selectedDivisionOption = tournament.divisionOptions.find((option) => option.value === division)
  const price = tournament.entryFee
  const total = players * price
  const activeCurrentEntries = getActiveUniqueEntries(currentEntries)
  const currentEntryCount = activeCurrentEntries.reduce((sum, entry) => sum + getEntryCount(entry), 0)
  const currentEntriesStatus = activeCurrentEntries.length ? getSummaryStatus(activeCurrentEntries) : null

  useEffect(() => {
    void setQuery((current) => {
      const next: Partial<typeof current> = {}

      if (current.tourId !== tourId) {
        next.tourId = tourId
      }

      if (current.formId !== initialFormId) {
        next.formId = initialFormId
      }

      if (current.players == null || (initialSubscription && current.players !== initialPlayers)) {
        next.players = initialPlayers
      }

      if (!current.division || !validDivisionValues.has(current.division) || initialSubscription) {
        next.division = division
      }

      return Object.keys(next).length ? next : null
    })
  }, [division, initialFormId, initialPlayers, initialSubscription, setQuery, tourId, validDivisionValues])

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
    <main className='space-y-6 py-6 sm:space-y-8'>
      <div className='flex items-center justify-between'>
        <div className='relative flex items-center gap-2 text-base md:text-xl font-poly'>
          <Icon name='tag-arrow' className='size-6 text-sky-500 mb-0.5 hidden md:flex' />
          <div className='flex items-center space-x-2 md:space-x-4'>
            <Typewrite text='New Entry' speed={20} showCursor={false} className='text-sky-500 whitespace-nowrap' />
            <Icon name='chevron-right' className='size-4 md:size-5 text-slate-500' />
            <Typewrite
              text={tournament.title}
              speed={15}
              showCursor={false}
              className='font-light text-slate-900 dark:text-foreground capitalize'
              initialDelay={250}
            />
            <Icon name='chevron-right' className='size-5 text-slate-500 hidden md:flex' />
            <Typewrite
              text={formId}
              speed={15}
              showCursor={false}
              className='hidden md:flex text-slate-500/50 uppercase font-light'
              initialDelay={1500}
            />
          </div>
        </div>

        {currentEntriesStatus ? (
          <Link
            href='/subscriptions'
            prefetch='auto'
            className={cn(
              'flex h-12 items-center space-x-3 rounded-md border px-4 py-2 transition-colors hover:bg-muted/40',
              statusStyles[currentEntriesStatus]
            )}>
            <div className='flex flex-col'>
              <span className='font-okx text-sm font-medium'>
                {currentEntryCount} {currentEntryCount === 1 ? 'Entry' : 'Entries'}
              </span>
              <span className='font-ios text-xs uppercase tracking-widest'>{formatStatus(currentEntriesStatus)}</span>
            </div>
            <Icon name='chevron-right' className='size-5 opacity-70' />
          </Link>
        ) : null}
      </div>
      <Card className='relative w-full max-w-7xl rounded-lg border border-slate-400 dark:border-background dark:bg-slate-700 bg-slate-200/20 shadow-md shadow-slate-100 dark:shadow-none p-0'>
        <CardContent className='p-0'>
          {tourId ? (
            <>
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border-b'>
                <div className='space-y-1'>
                  <p className='font-ios text-xs uppercase tracking-widest dark:text-slate-400'>
                    {tournament.venue.split(',').pop()}
                  </p>
                  <h2 id='book-now-title' className='font-heading text-xl font-semibold tracking-tight sm:text-xl'>
                    {tournament.venue.split(',').shift()}
                  </h2>
                </div>

                <div className='grid grid-cols-3 gap-4 sm:grid-cols-3 md:gap-12'>
                  <div className='p-0 space-y-1.5'>
                    <p className='font-ios text-xs uppercase tracking-widest dark:text-slate-400'>Price</p>
                    <p className='font-okx font-medium mt-1 text-base'>
                      {price > 0 ? currencyFormatter.format(price) : tournament.entryFeeLabel}
                    </p>
                  </div>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-widest dark:text-slate-400'>Total</p>
                    <p className='font-okx font-medium mt-1 text-base'>{currencyFormatter.format(total)}</p>
                  </div>
                  <div className='p-0 space-y-1.5'>
                    <p className='text-xs uppercase tracking-widest dark:text-slate-400'>Entries</p>
                    <p className='font-okx font-medium mt-1 text-base'>{players}</p>
                  </div>
                </div>
                {/* Countdown */}
                <div className='flex items-start h-10 bg-slate-200/60 dark:bg-transparent'>
                  <div className='min-w-24 bg-sky-200/5 rounded-md px-4 py-2'>
                    <div className='flex items-center space-x-2 font-ios text-foreground dark:text-sky-500 text-base md:text-lg tracking-wide leading-none whitespace-nowrap'>
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
                totalAmount={total}
                division={division}
                initialEmail={initialEmail}
                initialPhone={initialPhone}
                initialSubscription={initialSubscription}
                paymentMethod={paymentMethod}
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
