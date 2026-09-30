'use client'

import { EventToolbar } from '@/app/admin/[eventId]/event-toolbar'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useMemo } from 'react'
import { HyperList } from '../list/hyperlist'
import { buttonVariants } from '../ui/button'

type Tournament = Doc<'tournaments'>

type EventRow = {
  date: string
  day: string
  event: Tournament
  feeLabel: string
  href: string | null
  monthLabel: string | null
  place: string
  slotsLabel: string
  sortOrder: number
  status: string
  summary: string
  time: string
  title: string
  tournamentId: string
}

interface EventsListProps {
  data: Tournament[]
}

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  timeZone: 'Asia/Manila',
  year: 'numeric'
})

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Manila',
  weekday: 'short'
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  timeZone: 'Asia/Manila'
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila'
})

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency',
  currencyDisplay: 'code'
})

function formatRegistrationFee(value: number) {
  if (value <= 0) {
    return 'Sponsor event'
  }

  return pesoFormatter.format(value)
}

function formatSlotsLabel(event: Tournament) {
  if (event.slots_limit) {
    return `${event.registered_slots}/${event.slots_limit} slots`
  }

  return `${event.registered_slots} registered`
}

function getStatus(event: Tournament) {
  if (event.published === false) {
    return 'Draft'
  }

  if (event.slots_limit && event.registered_slots >= event.slots_limit) {
    return 'Full'
  }

  return 'Published'
}

function getSummary(event: Tournament) {
  if (event.divisions?.length) {
    return event.divisions.join(' • ')
  }

  return event.description ?? 'Tournament details pending'
}

function getTournamentHref(event: Tournament) {
  if (!event.id) {
    return null
  }
  return `/admin/${event.id}`
}

function buildEventRows(events: Tournament[]): EventRow[] {
  const sortedEvents = [...events].sort((left, right) => left.gate_open_at - right.gate_open_at)
  let previousMonthLabel: string | null = null

  return sortedEvents.map((event) => {
    const eventDate = new Date(event.gate_open_at)
    const monthLabel = monthFormatter.format(eventDate)
    const shouldShowMonth = monthLabel !== previousMonthLabel
    previousMonthLabel = monthLabel

    return {
      event,
      tournamentId: event._id,
      sortOrder: -event.gate_open_at,
      monthLabel: shouldShowMonth ? monthLabel : null,
      day: dayFormatter.format(eventDate),
      date: dateFormatter.format(eventDate),
      time: timeFormatter.format(eventDate),
      title: event.title,
      place: event.venue,
      feeLabel: formatRegistrationFee(event.registration_fee),
      slotsLabel: formatSlotsLabel(event),
      status: getStatus(event),
      summary: getSummary(event),
      href: getTournamentHref(event)
    }
  })
}

export const EventsList = ({ data }: EventsListProps) => {
  const rows = useMemo(() => buildEventRows(data), [data])

  if (!rows.length) {
    return null
  }

  return (
    <HyperList
      data={rows}
      keyId='tournamentId'
      orderBy='sortOrder'
      component={EventRow}
      itemStyle='mb-8'
      container='space-y-3'
    />
  )
}

export const List = EventsList

const EventRow = (row: EventRow) => {
  return (
    <div>
      {row.monthLabel ? (
        <p className='mb-3 mt-5 px-1 font-ios text-xs font-medium uppercase tracking-widest text-muted-foreground first:mt-0 sm:text-sm'>
          {row.monthLabel}
        </p>
      ) : null}

      {/* Mobile */}
      <article className='rounded-lg border border-border/70 bg-background p-4 lg:hidden'>
        <div className='space-y-4'>
          <div className='flex items-start gap-3'>
            <div className='flex size-12 shrink-0 flex-col items-center justify-center rounded-md bg-foreground text-background'>
              <p className='font-ios text-[10px] uppercase leading-none'>{row.day}</p>
              <p className='mt-1 font-poly text-lg leading-none'>{row.date}</p>
            </div>
            <div className='min-w-0 flex-1 space-y-1'>
              <h3 className='font-poly text-base leading-snug text-foreground'>{row.title}</h3>
              <p className='text-sm text-muted-foreground'>{row.place}</p>
            </div>
            <span className='shrink-0 rounded-full bg-muted px-2 py-1 font-ios text-[10px] uppercase tracking-wide text-foreground'>
              {row.status}
            </span>
          </div>

          <div className='grid grid-cols-2 gap-3 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-3'>
            <div>
              <p className='font-ios text-[10px] uppercase tracking-wide text-muted-foreground'>Start</p>
              <p className='mt-1 text-foreground'>{row.time}</p>
            </div>
            <div>
              <p className='font-ios text-[10px] uppercase tracking-wide text-muted-foreground'>Entry fee</p>
              <p className='mt-1 text-foreground'>{row.feeLabel}</p>
            </div>
            <div className='col-span-2 sm:col-span-1'>
              <p className='font-ios text-[10px] uppercase tracking-wide text-muted-foreground'>Registration</p>
              <p className='mt-1 text-foreground'>{row.slotsLabel}</p>
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3'>
            <div className='w-36 max-w-full'>
              <EventToolbar event={row.event} />
            </div>
            {row.href ? (
              <Link className={cn(buttonVariants({ size: 'sm' }), 'rounded-full')} href={row.href}>
                <span className='dark:text-white'>Open event</span>
              </Link>
            ) : null}
          </div>
        </div>
      </article>

      {/* Desktop */}
      <article className='hidden rounded-xl border border-border/70 bg-background p-4 lg:grid lg:grid-cols-[64px_minmax(0,1fr)_120px_150px_auto] lg:items-center lg:gap-4'>
        <div className='flex items-center justify-center border-e border-border/70 pe-4'>
          <div className='space-y-1 text-center'>
            <p className='font-ios text-xs uppercase text-muted-foreground'>{row.day}</p>
            <p className='font-poly text-2xl leading-none text-foreground'>{row.date}</p>
          </div>
        </div>

        <div className='min-w-0 space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='min-w-0 font-poly text-lg text-foreground'>{row.title}</h3>
            <span
              className={cn(
                'rounded-full bg-muted px-2 py-0.5 font-ios text-[12px] uppercase tracking-wide text-foreground',
                { 'dark:text-blue-500 bg-blue-100/8': row.status.toLocaleLowerCase() === 'published' }
              )}>
              {row.status}
            </span>
          </div>

          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
            <Icon name='map-pin' className='size-4 shrink-0' />
            <span className='truncate'>{row.place}</span>
          </div>
          <p className='text-xs text-muted-foreground'>
            {row.time} · {row.slotsLabel}
          </p>
        </div>

        <div className='space-y-1'>
          <p className='font-ios text-[10px] uppercase tracking-wide text-muted-foreground'>Entry fee</p>
          <p className='text-sm text-foreground'>{row.feeLabel}</p>
        </div>
        <div className='w-36'>
          <EventToolbar event={row.event} />
        </div>
        <div className='flex justify-end'>
          {row.href ? (
            <Link
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'rounded-lg bg-[#eef1ea]')}
              href={row.href}>
              <span className='font-medium'>Open event</span>
            </Link>
          ) : (
            <span className='text-sm text-muted-foreground'>n/a</span>
          )}
        </div>
      </article>
    </div>
  )
}
