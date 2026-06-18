'use client'

import Image from 'next/image'
import Link from 'next/link'

import { GamesList } from '@/components/landing/games-list'
import { BookedGames } from '@/components/landing/types'
import { Topbar } from '@/components/layouts/topbar'
import { useTheme } from '@/components/theme'
import { Icon } from '@/lib/icons'
import { useMemo } from 'react'

const proofPoints = [
  { label: 'Views', value: '1.5k', icon: 'bar-chart' as const },
  { label: 'Entries', value: '132', icon: 'ticket' as const },
  { label: 'Confirmed', value: '84%', icon: 'check' as const }
]

const gamesList: BookedGames[] = [
  {
    day: 'Fri',
    date: '29',
    month: 'November',
    time: '10:00 - 14:00',
    place: '5, main golf course',
    team: 'Green kings',
    status: 'Paid',
    attendance: '6/8 have confirmed their presence',
    avatar: 'DG',
    extra: '+5'
  },
  {
    day: 'Sat',
    date: '30',
    month: 'November',
    time: '11:00 - 17:30',
    place: '4, north wing',
    team: 'Fore force',
    status: 'Unpaid',
    attendance: '4/4 have confirmed their presence',
    avatar: 'MK',
    extra: '+3'
  },
  {
    day: 'Sun',
    date: '01',
    month: 'December',
    time: '12:00 - 16:00',
    place: '5, main golf course',
    team: 'Jaylon Saris',
    status: 'Invite',
    attendance: 'We need you on our team for this game.',
    avatar: 'JS',
    extra: null,
    action: 'Accept'
  },
  {
    day: 'Mon',
    date: '02',
    month: 'December',
    time: '11:30 - 15:30',
    place: '2, clubhouse range',
    team: 'Rough riders',
    status: 'Paid',
    attendance: '4/6 have confirmed their presence',
    avatar: 'RR',
    extra: '+3'
  }
]

const courseStats = [
  { label: 'Total distance', value: '320', unit: 'yards' },
  { label: 'Putting avg', value: '1.8', unit: 'putts' },
  { label: 'Fairways hit', value: '80', unit: '%' }
]

export default function HomePage() {
  const { resolvedTheme } = useTheme()
  const darkTheme = useMemo(() => resolvedTheme === 'dark', [resolvedTheme])

  return (
    <div className='min-h-dvh dark:bg-background bg-[#1f2b27] sm:px-3 sm:py-4 text-[#1c2621] md:px-5 md:py-7 lg:px-10'>
      <div className='mx-auto max-w-410 overflow-hidden rounded-b-[1rem] md:rounded-[3rem] bg-[#dcebe5] dark:border shadow-[0_34px_110px_rgba(0,0,0,0.34)]'>
        <Topbar />
        <main className=' dark:bg-slate-400/90'>
          <section className='relative -mt-22 min-h-100 overflow-hidden rounded-b-[3rem] px-5 pb-8 pt-24 sm:px-8 lg:min-h-120 lg:px-12'>
            <Image
              src={darkTheme ? '/fairway-midnight.webp' : '/fairway-smooth.webp'}
              alt='fairway-smooth'
              fill
              priority
              sizes='(max-width: 768px) 100vw, 1600px'
              className='scale-110 object-cover object-[60%_55%] bg-blend-color'
              aria-hidden='true'
            />
            <div className='dark:hidden absolute inset-0 bg-[linear-gradient(180deg,rgba(224,244,239,0.98)_10%,rgba(209,229,221,0.4)_64%,rgba(32,95,51,0.64)_100%)]' />
            <div className='dark:hidden absolute inset-x-0 bottom-0 blur-2xl h-56 bg-[linear-gradient(180deg,rgba(42,103,55,0.0)_2%,rgba(43,103,50,0.3)_70%,rgba(35,88,47,0.98)_100%)]' />
            <div className='dark:hidden absolute inset-0 bg-[url("/noise.svg")] opacity-12 blur-lg' />

            <div className='relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(350px,480px)] lg:items-end'>
              <div className='max-w-3xl pt-6 md:pt-10'>
                <p className='mb-8 inline-flex rounded-full dark:bg-white/15 bg-white/40 px-4 py-2 text-sm font-medium text-[#23342e] dark:text-white shadow-sm backdrop-blur-xl'>
                  Upcoming Tournament
                </p>
                <h1 className='max-w-[20rem] font-poly text-4xl leading-[0.95] text-white drop-shadow-[0_8px_34px_rgba(22,54,31,0.34)] sm:max-w-3xl sm:text-7xl _lg:text-[7.2rem]'>
                  Golden Ticket
                </h1>
                <p className='hidden md:flex mt-6 max-w-xl text-base leading-7 text-white/90 sm:text-lg'>
                  Foreplay opens like a private club dashboard: clear bookings, live player context, and a course view
                  that makes the next tournament feel ready to join.
                </p>
                <p className='mt-6 max-w-xl text-base leading-7 text-white/90 sm:text-lg'>Malarayat</p>
                <div className='mt-8 flex flex-wrap items-center gap-5 text-sm font-medium text-white/85'>
                  {proofPoints.map((point) => (
                    <div key={point.label} className='flex items-center gap-2'>
                      <Icon name={point.icon} className='size-4 opacity-85' />
                      <span>{point.value}</span>
                      <span className='text-white/60'>{point.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='hidden gap-5 sm:grid md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
                {/*<FeatureEvent />*/}
                {/*<PracticeCard />*/}
              </div>
            </div>
          </section>

          <section className='grid gap-7 dark:bg-slate-400/60 bg-[#dcebe5] px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:px-12 lg:py-10'>
            <div>
              <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <h2 className='font-poly text-2xl leading-none'>Games</h2>
                  <button
                    className='flex size-5 md:size-8 items-center justify-center rounded-full bg-white/70 text-[#1d2824] shadow-sm'
                    type='button'
                    aria-label='Add booking'>
                    <Icon name='add' className='size-3 md:size-4 opacity-80' />
                  </button>
                </div>

                <div className='flex items-center gap-4 text-sm text-[#1d2824]/60'>
                  <Link className='flex items-center gap-1' href='/tournaments'>
                    <span className='font-okx font-medium text-slate-500 dark:text-slate-200'>view more</span>
                    <Icon
                      name='chevron-right'
                      className='size-4 text-slate-500 dark:text-slate-200 opacity-80 -mb-0.5'
                    />
                  </Link>
                </div>
              </div>
              <GamesList data={gamesList} />

              {/*<div className='space-y-4'>
                {gamesList.map((row, index) => {
                  const showMonth = index === 0 || gamesList[index - 1]?.month !== row.month

                  return (
                    <div key={`${row.day}-${row.date}-${row.team}`}>
                      {showMonth ? (
                        <p className='mb-3 mt-6 text-sm font-okx font-medium text-slate-500 dark:text-slate-200'>
                          {row.month}
                        </p>
                      ) : null}

                      <article className='grid gap-4 rounded-[22px] bg-white/72 ps-1 pe-4 py-4 shadow-[0_18px_42px_rgba(31,62,46,0.1)] backdrop-blur-xl md:grid-cols-[80px_minmax(190px,240px)_minmax(0,1fr)_auto] md:items-center'>
                        <div className='flex items-center justify-center gap-4 md:border-r md:border-[#1d2824]/10'>
                          <div className='text-center'>
                            <p className='font-okx font-light text-base text-[#ef4b20]'>{row.day}</p>
                            <p className='font-poly font-semibold text-xl leading-none'>{row.date}</p>
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
                            <p className='mt-1 truncate text-sm text-[#1d2824]/55'>{row.attendance}</p>
                          </div>
                        </div>

                        <div className='flex items-center justify-end gap-2'>
                          {row.action ? (
                            <Link
                              className={cn(
                                buttonVariants({ size: 'lg' }),
                                'rounded-full bg-[#ef4b20] px-6 text-white hover:bg-[#d63f19]'
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
                    </div>
                  )
                })}
              </div>
              */}
            </div>

            <aside className='rounded-[28px] bg-white/62 p-5 shadow-[0_24px_70px_rgba(31,62,46,0.12)] backdrop-blur-xl sm:p-6'>
              <div className='flex items-center justify-between gap-4'>
                <h2 className='font-poly text-3xl leading-none'>Golf Course</h2>
                <button
                  className='flex size-12 items-center justify-center rounded-full bg-white/85 text-[#1d2824]'
                  type='button'
                  aria-label='Open course map'>
                  <Icon name='golf-flag' className='size-5' />
                </button>
              </div>

              <div className='mt-6 grid gap-5 sm:grid-cols-[minmax(0,1fr)_128px] lg:grid-cols-[minmax(0,1fr)_132px]'>
                <div className='relative min-h-97.5 overflow-hidden rounded-[24px] bg-[#edf4ef] shadow-inner'>
                  <div
                    className='absolute inset-x-9 bottom-8 top-5 rotate-[-5deg] bg-[radial-gradient(circle_at_42%_28%,#eef5c8_0_4%,transparent_5%),radial-gradient(circle_at_62%_36%,#f3e6c8_0_5%,transparent_6%),radial-gradient(circle_at_44%_56%,#edf4c6_0_4%,transparent_5%),linear-gradient(145deg,#8fbf69,#4f8f55_45%,#2d6b43)] shadow-[inset_0_0_32px_rgba(19,63,35,0.35),0_18px_38px_rgba(34,75,45,0.28)]'
                    style={{ borderRadius: '46% 54% 48% 52% / 34% 38% 62% 66%' }}
                  />
                  <div
                    className='absolute inset-x-16 bottom-14 top-12 rotate-[-8deg] border-2 border-dashed border-white/75'
                    style={{ borderRadius: '50% 48% 52% 46% / 36% 44% 58% 64%' }}
                  />
                  <span className='absolute left-[49%] top-[28%] size-3 rounded-full bg-white shadow' />
                  <span className='absolute left-[57%] top-[46%] size-3 rounded-full bg-white shadow' />
                  <span className='absolute left-[45%] top-[64%] size-3 rounded-full bg-white shadow' />
                  <span className='absolute right-[19%] top-[32%] flex size-9 items-center justify-center rounded-full bg-[#ef4b20] text-white shadow-lg'>
                    <Icon name='flag-fill' className='size-4' />
                  </span>
                  <span className='absolute bottom-11 left-[48%] flex size-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1d2824] shadow-lg'>
                    DG
                  </span>
                </div>

                <div className='grid gap-4'>
                  {courseStats.map((stat) => (
                    <div key={stat.label} className='border-b border-[#1d2824]/10 pb-4 last:border-b-0'>
                      <p className='text-sm leading-5 text-[#1d2824]/45'>{stat.label}</p>
                      <p className='mt-2 font-poly text-3xl leading-none'>
                        {stat.value}
                        <span className='ml-1 font-sans text-sm font-medium text-[#1d2824]/65'>{stat.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className='mt-5 grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-[18px] bg-white/86 p-4 shadow-sm'>
                <span className='flex size-12 items-center justify-center rounded-full bg-[#c6e2d6] text-sm font-semibold'>
                  DG
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-base font-semibold'>Davis Geidt</p>
                  <p className='truncate text-sm text-[#1d2824]/50'>Rough riders</p>
                </div>
                <div className='text-center'>
                  <p className='font-semibold'>70%</p>
                  <p className='text-xs text-[#1d2824]/45'>GIR</p>
                </div>
                <div className='text-center'>
                  <p className='font-semibold'>4</p>
                  <p className='text-xs text-[#1d2824]/45'>Strokes</p>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
