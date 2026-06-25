import { featuredTournament } from '@/components/protected/tournament-experience'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { buttonVariants } from '../ui/button'
import { MapButton } from './map-button'

const practiceDays = [
  { day: '6a', label: 'In', height: 58 },
  { day: '7a', label: 'Tee', height: 88 },
  { day: '15', label: 'SUV', height: 96, active: true },
  { day: '12p', label: 'Score', height: 68 },
  { day: 'VIP', label: 'Awards', height: 78 }
]
export const PracticeCard = () => {
  return (
    <div className='rounded-[22px] border border-white/45 bg-white/20 p-5 shadow-[0_24px_70px_rgba(24,62,37,0.16)] backdrop-blur-2xl'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-poly text-2xl leading-none text-[#1d2824]'>Event flow</h2>
        <button className='inline-flex items-center gap-1 text-sm font-medium text-[#1d2824]/65' type='button'>
          July 18
          <Icon name='chevron-down' className='size-4' />
        </button>
      </div>

      <div className='mt-8 grid grid-cols-5 items-end gap-4'>
        {practiceDays.map((day) => (
          <div key={day.day} className='flex min-w-0 flex-col items-center gap-3'>
            <div
              className={cn(
                'w-full max-w-14 rounded-full',
                day.active ? 'bg-[#ef4b20] shadow-[0_14px_28px_rgba(239,75,32,0.24)]' : 'bg-white/80'
              )}
              style={{ height: day.height }}
            />
            <div
              className={cn(
                'flex h-8 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold',
                day.active ? 'bg-[#ef4b20] text-white' : 'bg-white/80 text-[#1d2824]/65'
              )}>
              {day.label}
            </div>
            <p className={cn('text-sm font-medium', day.active ? 'text-white' : 'text-[#1d2824]/65')}>{day.day}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export const EventViewer = () => {
  return (
    <div className='min-h-44 rounded-[22px] border border-white/60 dark:border-slate-500/50 bg-white/52 dark:bg-foreground/10 backdrop-blur-3xl p-5 shadow-[0_24px_70px_rgba(24,62,37,0.2)]'>
      <div className='flex h-full flex-col justify-between'>
        <div>
          <h2 className='flex items-center space-x-2 mt-2 font-poly text-xl leading-tight text-foreground/80 dark:text-slate-300'>
            <Icon name='golf-flag' className='size-5' />
            <span className='ml-2'>Overview</span>
          </h2>
          <div className='mt-4 grid divide-y divide-border/60 dark:divide-slate-500/50 divide-dashed border border-dashed border-border/60 bg-white/50 dark:bg-foreground/85 rounded-lg overflow-hidden'>
            <div className='flex items-center gap-2 px-3 py-2 text-sm text-[#1d2824]/78 ring-1 ring-inset ring-[#1d2824]/5 rounded-t-lg'>
              <Icon name='watch' className='size-4.5 shrink-0 text-slate-600' />
              <span>{featuredTournament.dateLabel}</span>
            </div>

            <div className='flex items-center justify-between px-3 py-2 text-sm text-[#1d2824]/78 ring-1 ring-inset ring-[#1d2824]/5 rounded-b-lg'>
              <div className='flex items-center gap-2'>
                <Icon name='map-pin' className='size-4.5 shrink-0 text-slate-600' />
                <span className='truncate'>{featuredTournament.venue}</span>
              </div>
              {featuredTournament.venueCoordinates ? (
                <MapButton coordinates={featuredTournament.venueCoordinates} venue={featuredTournament.venue} />
              ) : null}
            </div>
          </div>
        </div>

        <div className='mt-6 flex items-center justify-between gap-4 w-full'>
          <Link
            className={cn(
              buttonVariants({ size: 'xl' }),
              'rounded-lg bg-primary px-5 text-white hover:bg-primary/80 flex-1 md:text-base'
            )}
            href={`/tournaments/${featuredTournament.id}`}>
            Open Tournament
          </Link>

          {/*<div className='rounded-full bg-white/75 px-4 py-3 text-sm font-semibold shadow-sm'>
            {featuredTournament.feeLabel}
          </div>*/}
        </div>
      </div>
    </div>
  )
}
