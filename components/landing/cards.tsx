import { featuredTournament } from '@/components/protected/tournament-experience'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { buttonVariants } from '../ui/button'

const practiceDays = [
  { day: 'Mon', label: '3h', height: 74 },
  { day: 'Tue', label: '-', height: 30 },
  { day: 'Wed', label: '3h', height: 74 },
  { day: 'Thu', label: '4h', height: 96, active: true },
  { day: 'Fri', label: '-', height: 30 }
]
export const PracticeCard = () => {
  return (
    <div className='rounded-[22px] border border-white/45 bg-white/20 p-5 shadow-[0_24px_70px_rgba(24,62,37,0.16)] backdrop-blur-2xl'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-poly text-2xl leading-none text-[#1d2824]'>Practice time</h2>
        <button className='inline-flex items-center gap-1 text-sm font-medium text-[#1d2824]/65' type='button'>
          Weekdays
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

export const FeaturedEvent = () => {
  return (
    <div className='min-h-72 rounded-[22px] border border-white/45 bg-white/18 p-5 shadow-[0_24px_70px_rgba(24,62,37,0.18)] backdrop-blur-2xl'>
      <div className='flex h-full flex-col justify-between'>
        <div>
          <p className='text-sm font-medium text-[#27352f]/75'>Featured event</p>
          <h2 className='mt-3 font-poly text-3xl leading-tight text-[#1e2924]'>{featuredTournament.title}</h2>
          <p className='mt-3 text-sm leading-6 text-[#31413a]/75'>{featuredTournament.venue}</p>
        </div>

        <div className='mt-8 flex items-center justify-between gap-3'>
          <Link
            className={cn(
              buttonVariants({ size: 'lg' }),
              'rounded-full bg-white/80 px-5 text-[#1d2824] shadow-sm hover:bg-white'
            )}
            href={`/tournaments/${featuredTournament.id}`}>
            View tournament
          </Link>
          <div className='rounded-full bg-white/75 px-4 py-3 text-sm font-semibold shadow-sm'>
            {featuredTournament.feeLabel}
          </div>
        </div>
      </div>
    </div>
  )
}
