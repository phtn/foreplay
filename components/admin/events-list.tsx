'use client'

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
  style: 'currency'
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

function getStatusClass(status: string) {
  if (status === 'Draft') {
    return 'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-300'
  }

  if (status === 'Full') {
    return 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900'
  }

  return 'bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-300'
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

  return `/tournaments/${event.id}`
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

  return <HyperList data={rows} keyId='tournamentId' orderBy='sortOrder' component={EventRow} container='space-y-4' />
}

export const List = EventsList

const EventRow = (row: EventRow) => {
  return (
    <div className='space-y-3'>
      {row.monthLabel ? (
        <p className='mt-2 text-sm font-okx font-medium text-slate-500 dark:text-slate-300'>{row.monthLabel}</p>
      ) : null}

      <article className='overflow-hidden rounded-lg border border-[#1d2824]/8 backdrop-blur-xl md:hidden'>
        <div className='space-y-4 p-4 sm:p-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-4'>
              <div className='shrink-0 rounded-xl bg-[#1d2824] px-3 py-2 text-center text-white '>
                <p className='font-okx text-[10px] uppercase tracking-[0.24em] text-white/65'>{row.day}</p>
                <p className='mt-1 font-poly text-2xl leading-none'>{row.date}</p>
              </div>

              <div className='min-w-0'>
                <p className='font-okx text-base text-[#1d2824]'>{row.title}</p>
                <p className='mt-1 text-sm text-[#1d2824]/65'>{row.place}</p>
              </div>
            </div>

            <span
              className={cn(
                'inline-flex rounded-md px-2.5 py-1 font-ios text-[10px] uppercase tracking-widest',
                getStatusClass(row.status)
              )}>
              {row.status}
            </span>
          </div>

          <p className='text-sm leading-6 text-[#1d2824]/70'>{row.summary}</p>

          <div className='grid grid-cols-2 gap-3 rounded-2xl border border-[#1d2824]/10 bg-white/60 p-3'>
            <div>
              <p className='font-ios text-[10px] uppercase tracking-widest text-[#1d2824]/45'>Start</p>
              <p className='mt-1 text-sm text-[#1d2824]/80'>{row.time}</p>
            </div>
            <div>
              <p className='font-ios text-[10px] uppercase tracking-widest text-[#1d2824]/45'>Entry fee</p>
              <p className='mt-1 text-sm text-[#1d2824]/80'>{row.feeLabel}</p>
            </div>
            <div className='col-span-2'>
              <p className='font-ios text-[10px] uppercase tracking-widest text-[#1d2824]/45'>Field</p>
              <p className='mt-1 text-sm text-[#1d2824]/80'>{row.slotsLabel}</p>
            </div>
          </div>

          <div className='flex items-center justify-end'>
            {row.href ? (
              <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2 rounded-full px-4')} href={row.href}>
                Open event
                <Icon name='arrow-right' className='size-4' />
              </Link>
            ) : (
              <span className='text-sm text-[#1d2824]/45'>Public route unavailable</span>
            )}
          </div>
        </div>
      </article>

      <article className='hidden rounded-[22px] border border-[#1d2824]/8 bg-white/70 p-4 shadow-[0_18px_42px_rgba(31,62,46,0.1)] backdrop-blur-xl md:grid md:grid-cols-[88px_minmax(0,1.35fr)_minmax(180px,0.8fr)_auto] md:items-center md:gap-4'>
        <div className='flex items-center justify-center border-r border-[#1d2824]/10 pr-4'>
          <div className='text-center'>
            <p className='font-okx text-sm text-[#ef4b20]'>{row.day}</p>
            <p className='font-poly text-2xl leading-none text-[#1d2824]'>{row.date}</p>
            <p className='mt-2 text-xs text-[#1d2824]/55'>{row.time}</p>
          </div>
        </div>

        <div className='min-w-0 space-y-2'>
          <div className='flex items-center gap-3'>
            <p className='truncate font-okx text-base text-[#1d2824]'>{row.title}</p>
            <span
              className={cn(
                'inline-flex rounded-md px-2.5 py-1 font-ios text-[10px] uppercase tracking-widest',
                getStatusClass(row.status)
              )}>
              {row.status}
            </span>
          </div>

          <div className='flex items-center gap-2 text-sm text-[#1d2824]/70'>
            <Icon name='map-pin' className='size-4 text-[#1d2824]/40' />
            <span className='truncate'>{row.place}</span>
          </div>

          <p className='line-clamp-2 text-sm leading-6 text-[#1d2824]/65'>{row.summary}</p>
        </div>

        <div className='grid gap-3 border-l border-[#1d2824]/10 pl-4 text-sm text-[#1d2824]/75'>
          <div>
            <p className='font-ios text-[10px] uppercase tracking-widest text-[#1d2824]/40'>Entry fee</p>
            <p className='mt-1 font-medium text-[#1d2824]'>{row.feeLabel}</p>
          </div>

          <div>
            <p className='font-ios text-[10px] uppercase tracking-widest text-[#1d2824]/40'>Field</p>
            <p className='mt-1 font-medium text-[#1d2824]'>{row.slotsLabel}</p>
          </div>
        </div>

        <div className='flex items-center justify-end'>
          {row.href ? (
            <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2 rounded-full px-4')} href={row.href}>
              Open event
              <Icon name='arrow-right' className='size-4' />
            </Link>
          ) : (
            <span className='text-sm text-[#1d2824]/45'>Public route unavailable</span>
          )}
        </div>
      </article>
    </div>
  )
}
