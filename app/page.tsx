'use client'

import Image from 'next/image'
import Link from 'next/link'

import { EventViewer } from '@/components/landing/cards'
import { GamesList } from '@/components/landing/games-list'
import { BookedGames } from '@/components/landing/types'
import { Topbar } from '@/components/layouts/topbar'
import { featuredTournament } from '@/components/protected/tournament-experience'
import { useTheme } from '@/components/theme'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

const proofPoints = [
  { label: 'Players', value: '120', icon: 'ticket' as const },
  { label: 'Cash purse', value: '₱450k', icon: 'bar-chart' as const },
  { label: 'Grand prize', value: 'Everest', icon: 'check' as const }
]

const gamesList: BookedGames[] = [
  {
    day: 'Sat',
    date: '18',
    month: 'July',
    time: '06:00 - 07:00',
    place: 'Pradera Verde clubhouse',
    team: 'Sponsor check-in',
    status: 'Open',
    attendance: 'Corporate guests, player kits, and sponsor flight confirmation.',
    avatar: 'SM',
    extra: '+4'
  },
  {
    day: 'Sat',
    date: '18',
    month: 'July',
    time: '07:00 - 12:30',
    place: 'Pinatubo Course',
    team: 'Shotgun start',
    status: 'Live',
    attendance: 'System 36 play with sponsor activations across priority holes.',
    avatar: '36',
    extra: '+18'
  },
  {
    day: 'Sat',
    date: '18',
    month: 'July',
    time: 'Hole 15',
    place: 'Island green',
    team: 'Hole-in-one prize',
    status: 'Prize',
    attendance: '2026 Ford Everest 4x2 Sport headline moment.',
    avatar: 'FE',
    extra: null,
    action: 'Sponsor',
    actionHref: `/tournaments/${featuredTournament.id}/sponsorship`
  },
  {
    day: 'Sat',
    date: '18',
    month: 'July',
    time: 'After scoring',
    place: 'VIP banquet',
    team: 'Awards program',
    status: 'VIP',
    attendance: 'Cash prize ceremony, sponsor acknowledgments, and banquet networking.',
    avatar: 'VP',
    extra: '+1'
  }
]

const courseStats = [
  { label: 'Cash prize purse', value: '450k', unit: 'PHP' },
  { label: 'Sponsor tiers', value: '4', unit: 'levels' },
  { label: 'Player field', value: '120', unit: 'slots' }
]

export default function HomePage() {
  const { resolvedTheme } = useTheme()
  const darkTheme = useMemo(() => resolvedTheme === 'dark', [resolvedTheme])
  const router = useRouter()

  return (
    <div className='min-h-dvh dark:bg-background bg-[#1f2b27] sm:px-3 sm:py-4 text-[#1c2621] md:px-5 md:py-7 lg:px-10'>
      <div className='mx-auto max-w-410 overflow-hidden rounded-b-md md:rounded-[3rem] bg-[#dcebe5] dark:md:border shadow-[0_34px_110px_rgba(0,0,0,0.34)]'>
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
                <h1 className='max-w-136 font-poly text-4xl leading-[0.95] dark:text-white drop-shadow-[0_8px_34px_rgba(22,54,31,0.34)] sm:max-w-3xl sm:text-6xl _lg:text-[7.2rem]'>
                  Seoul of Manila
                </h1>
                <p className='hidden md:flex mt-6 max-w-xl text-base leading-7 dark:text-white/90 text-foreground/80 sm:text-lg'>
                  A corporate golf and networking tournament at Pradera Verde with System 36 play, premium sponsor
                  visibility, and a Ford Everest hole-in-one grand prize.
                </p>

                <div className='mt-10 md:mt-8 md:flex flex-wrap items-center gap-5 text-sm font-medium text-white'>
                  {proofPoints.map((point) => (
                    <div key={point.label} className='flex items-center gap-2 py-1'>
                      <Icon name={point.icon} className='size-4 opacity-95' />
                      <span className='font-okx'>{point.value}</span>
                      <span className='text-white/60'>{point.label}</span>
                    </div>
                  ))}
                </div>
                <div className='px-4'>
                  <Button
                    onClick={() => router.push(`/tournaments/som-2026/entry`)}
                    className='md:hidden bg-slate-100 text-slate-800 font-semibold w-full mt-4 mx-auto rounded-full'
                    size='xl'>
                    Book Entry
                  </Button>
                </div>
              </div>

              <div className='hidden gap-5 sm:grid'>
                <EventViewer />
              </div>
            </div>
          </section>

          <section className='grid gap-7 dark:bg-slate-400/60 bg-[#dcebe5] px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:px-12 lg:py-10'>
            <div className='md:block hidden'>
              <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <h2 className='font-poly text-2xl leading-none'>Tournament Day</h2>
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
                <h2 className='font-poly text-3xl leading-none'>Pinatubo Course</h2>
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
                    SM
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
                  SM
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-base font-semibold'>Seoul of Manila</p>
                  <p className='truncate text-sm text-[#1d2824]/50'>Sponsor flight</p>
                </div>
                <div className='text-center'>
                  <p className='font-semibold'>36</p>
                  <p className='text-xs text-[#1d2824]/45'>Format</p>
                </div>
                <div className='text-center'>
                  <p className='font-semibold'>4</p>
                  <p className='text-xs text-[#1d2824]/45'>Tiers</p>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
