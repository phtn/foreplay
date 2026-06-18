import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { HyperList } from '../list/hyperlist'
import { buttonVariants } from '../ui/button'
import { BookedGames } from './types'

interface GamesListProps {
  data: BookedGames[]
}

export const GamesList = ({ data }: GamesListProps) => {
  const showMonthFn = (row: BookedGames, index: number) => index === 0 || data[index - 1]?.month !== row.month
  return (
    <HyperList data={data} component={GameRow} container='space-y-4'>
      {showMonthFn(data[0], 0) ? (
        <p className='mb-3 mt-6 text-sm font-okx font-medium text-slate-500 dark:text-slate-200'>
          {showMonthFn(data[0], 0)}
        </p>
      ) : null}
    </HyperList>
  )
}

function getMobileStatusClass(status: string) {
  if (status === 'Invite') {
    return 'bg-[#ef4b20]/10 text-[#ef4b20] ring-1 ring-inset ring-[#ef4b20]/15'
  }

  if (status === 'Unpaid') {
    return 'bg-[#1d2824]/10 text-[#1d2824]/75 ring-1 ring-inset ring-[#1d2824]/10'
  }

  return 'bg-[#1d2824] text-white shadow-sm'
}

const GameRow = (row: BookedGames) => {
  return (
    <>
      <article className='overflow-hidden rounded-[26px] border border-[#1d2824]/8 bg-white/78 shadow-[0_18px_48px_rgba(31,62,46,0.12)] backdrop-blur-xl md:hidden'>
        <div className='relative p-4 sm:p-5'>
          <div className='absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(29,40,36,0.14),rgba(239,75,32,0.28),transparent)]' />

          <div className='flex items-start gap-4'>
            <div className='shrink-0 rounded-[22px] bg-[#1d2824] px-3 py-2.5 text-white shadow-[0_12px_28px_rgba(29,40,36,0.18)]'>
              <p className='font-okx text-[10px] uppercase tracking-[0.24em] text-white/65'>{row.day}</p>
              <p className='mt-1 font-poly text-2xl leading-none'>{row.date}</p>
            </div>

            <div className='min-w-0 flex-1'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <h3 className='truncate text-[1.05rem] font-semibold text-[#1d2824]'>{row.team}</h3>
                  <p className='mt-1 text-sm leading-6 text-[#1d2824]/60'>{row.attendance}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]',
                    getMobileStatusClass(row.status)
                  )}>
                  {row.status}
                </span>
              </div>

              <div className='mt-4 grid gap-2'>
                <div className='flex items-center gap-2 rounded-2xl bg-[#edf4f1] px-3 py-2 text-sm text-[#1d2824]/78 ring-1 ring-inset ring-[#1d2824]/5'>
                  <Icon name='watch' className='size-4 shrink-0 text-[#1d2824]/45' />
                  <span>{row.time}</span>
                </div>
                <div className='flex items-center gap-2 rounded-2xl bg-[#edf4f1] px-3 py-2 text-sm text-[#1d2824]/78 ring-1 ring-inset ring-[#1d2824]/5'>
                  <Icon name='map-pin' className='size-4 shrink-0 text-[#1d2824]/45' />
                  <span className='truncate'>{row.place}</span>
                </div>
              </div>

              <div className='mt-4 flex items-center justify-between gap-3 border-t border-[#1d2824]/8 pt-4'>
                <div className='flex -space-x-2'>
                  <span className='flex size-9 items-center justify-center rounded-full bg-[#c6e2d6] text-xs font-semibold text-[#1d2824] ring-2 ring-white/95'>
                    {row.avatar}
                  </span>
                  {row.extra ? (
                    <span className='flex size-9 items-center justify-center rounded-full bg-[#edf4f1] text-xs font-semibold text-[#1d2824] ring-2 ring-white/95'>
                      {row.extra}
                    </span>
                  ) : null}
                </div>

                {row.action ? (
                  <Link
                    className={cn(
                      buttonVariants({ size: 'sm' }),
                      'rounded-full bg-hermes px-4 text-white shadow-sm hover:bg-[#d63f19]'
                    )}
                    href='/auth'>
                    {row.action}
                  </Link>
                ) : (
                  <div className='flex items-center gap-2'>
                    <button
                      className='flex size-9 items-center justify-center rounded-full bg-white text-[#1d2824]/85 shadow-sm ring-1 ring-inset ring-[#1d2824]/8 hover:bg-[#1d2824]/5'
                      type='button'
                      aria-label={`Add player to ${row.team}`}>
                      <Icon name='add' className='size-4' />
                    </button>
                    <button
                      className='flex size-9 items-center justify-center rounded-full bg-white text-[#1d2824]/85 shadow-sm ring-1 ring-inset ring-[#1d2824]/8 hover:bg-[#1d2824]/5'
                      type='button'
                      aria-label={`Open ${row.team} details`}>
                      <Icon name='cf-pen' className='size-4' />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      <article className='hidden gap-4 rounded-[22px] bg-white/72 p-4 shadow-[0_18px_42px_rgba(31,62,46,0.1)] backdrop-blur-xl sm:ps-1 sm:pe-4 md:grid md:grid-cols-[80px_minmax(190px,240px)_minmax(0,1fr)_auto] md:items-center'>
        <div className='flex items-center justify-start gap-4 md:justify-center md:border-r md:border-[#1d2824]/10'>
          <div className='text-center'>
            <p className='font-okx font-light text-sm text-[#ef4b20] sm:text-base'>{row.day}</p>
            <p className='font-poly font-semibold text-lg leading-none sm:text-xl'>{row.date}</p>
          </div>
        </div>

        <div className='space-y-2 text-sm text-[#1d2824]/80 md:border-r md:border-[#1d2824]/10 md:pr-5'>
          <div className='flex items-center gap-2'>
            <Icon name='watch' className='size-5 text-[#1d2824]/45' />
            {row.time}
          </div>
          <div className='flex items-center gap-2'>
            <Icon name='map-pin' className='size-5 text-[#1d2824]/45' />
            {row.place}
          </div>
        </div>

        <div className='flex min-w-0 items-center gap-4'>
          <div className='flex shrink-0 -space-x-2'>
            <span className='flex size-11 items-center justify-center rounded-full bg-[#c6e2d6] text-sm font-semibold text-[#1d2824] ring-4 ring-white/60'>
              {row.avatar}
            </span>
            {row.extra ? (
              <span className='flex size-11 items-center justify-center rounded-full bg-[#edf4f1] text-sm font-semibold text-[#1d2824] ring-4 ring-white/60'>
                {row.extra}
              </span>
            ) : null}
          </div>

          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='truncate text-base font-semibold'>{row.team}</h3>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-bold',
                  row.status === 'Unpaid'
                    ? 'bg-[#1d2824]/25 text-white'
                    : row.status === 'Invite'
                      ? 'bg-transparent text-[#1d2824]/50'
                      : 'bg-[#1d2824] text-white'
                )}>
                {row.status}
              </span>
            </div>
            <p className='mt-1 text-sm text-[#1d2824]/55 sm:truncate'>{row.attendance}</p>
          </div>
        </div>

        <div className='flex flex-wrap items-center justify-start gap-2 md:justify-end'>
          {row.action ? (
            <Link
              className={cn(
                buttonVariants({ size: 'lg' }),
                'rounded-full bg-[#ef4b20] px-5 text-white hover:bg-[#d63f19] sm:px-6'
              )}
              href='/auth'>
              {row.action}
            </Link>
          ) : (
            <>
              <button
                className='flex size-10 items-center justify-center rounded-full text-[#1d2824]/85 hover:bg-[#1d2824]/5'
                type='button'
                aria-label={`Add player to ${row.team}`}>
                <Icon name='add' className='size-4' />
              </button>
              <button
                className='flex size-10 items-center justify-center rounded-full text-[#1d2824]/85 hover:bg-[#1d2824]/5'
                type='button'
                aria-label={`Open ${row.team} details`}>
                <Icon name='cf-pen' className='size-4' />
              </button>
            </>
          )}
        </div>
      </article>
    </>
  )
}
