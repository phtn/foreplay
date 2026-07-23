'use client'

import Link from 'next/link'

import { useAppForm } from '@/components/form'
import { EventViewer } from '@/components/landing/cards'
import { GamesList } from '@/components/landing/games-list'
import { MapButton } from '@/components/landing/map-button'
import { BookedGames } from '@/components/landing/types'
import { Topbar } from '@/components/layouts/topbar'
import { featuredTournament } from '@/components/protected/tournament-experience'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { useRouter } from 'next/navigation'
import { GolfCourse } from './course'

const proofPoints = [
  { label: '', value: 'Pradera Verde Golf & Country Club', icon: 'location' as const },
  { label: 'Cash Purse', value: '₱450k', icon: 'cash' as const },
  { label: 'Hole-in-one', value: 'Ford Everest', icon: 'trophy' as const }
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
  { label: 'HOLES', value: '18', unit: '' },
  { label: 'PAR', value: '72', unit: '' },
  { label: 'START', value: '7AM', unit: '' }
]

export default function HomePage() {
  const router = useRouter()

  const form = useAppForm({
    defaultValues: {
      search: ''
    }
  })

  return (
    <div className='min-h-dvh dark:bg-background bg-[#1f2b27] sm:px-3 sm:py-4 text-[#1c2621] md:px-5 md:py-7 lg:px-10'>
      <div className='mx-auto max-w-410 overflow-hidden md:rounded-[3rem] bg-[#dcebe5] dark:md:border shadow-[0_34px_110px_rgba(0,0,0,0,0)]'>
        <Topbar />
        <main className=' dark:bg-slate-400/90'>
          <section className='relative -mt-22 min-h-100 overflow-hidden rounded-b-[3rem] px-5 pb-8 pt-24 sm:px-8 lg:min-h-120 lg:px-12'>
            <div
              className="absolute inset-0 scale-110 bg-[url('/fairway-smooth.webp')] bg-cover bg-position-[60%_55%] bg-blend-color dark:bg-[url('/fairway-midnight.webp')]"
              aria-hidden='true'
            />
            <div className='dark:hidden absolute inset-0 bg-[linear-gradient(180deg,rgba(224,244,239,0.98)_10%,rgba(209,229,221,0.4)_64%,rgba(32,95,51,0.64)_100%)]' />
            <div className='dark:hidden absolute inset-x-0 bottom-0 blur-2xl h-56 bg-[linear-gradient(180deg,rgba(42,103,55,0.0)_2%,rgba(43,103,50,0.3)_70%,rgba(35,88,47,0.98)_100%)]' />
            <div className='dark:hidden absolute inset-0 bg-[url("/noise.svg")] opacity-12 blur-lg' />

            <div className='relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(350px,480px)] lg:items-end'>
              <div className='max-w-3xl pt-6 md:pt-10'>
                <div className='flex items-center space-x-2'>
                  <p className='mb-8 inline-flex rounded-full dark:bg-white/15 bg-white/70 px-4 py-2 text-sm font-medium text-[#23342e] dark:text-white shadow-sm backdrop-blur-xl'>
                    July 18, 2026
                  </p>
                </div>
                <h1 className='max-w-136 font-poly text-4xl leading-[0.95] dark:text-white drop-shadow-[0_8px_34px_rgba(22,54,31,0.34)] sm:max-w-3xl sm:text-6xl _lg:text-[7.2rem]'>
                  Seoul of Manila
                </h1>
                <p className='hidden md:flex mt-6 max-w-xl text-base leading-7 dark:text-white/90 text-foreground/80 sm:text-lg'>
                  A corporate golf and networking tournament at Pradera Verde with System 36 play, premium sponsor
                  visibility, and a Ford Everest hole-in-one grand prize.
                </p>

                <div className='mt-10 md:mt-8 md:flex flex-wrap items-center gap-5 text-sm font-medium text-white'>
                  {proofPoints.map((point, idx) => (
                    <div key={point.label} className='flex items-center gap-2 py-1 font-okx'>
                      <Icon name={point.icon} className='size-4 opacity-95' />
                      <span className=''>{point.value}</span>
                      {featuredTournament.venueCoordinates && idx === 0 ? (
                        <MapButton
                          coordinates={featuredTournament.venueCoordinates}
                          venue={featuredTournament.venue}
                          className='size-3.5 text-white'
                        />
                      ) : (
                        <span className='text-white/80'>{point.label}</span>
                      )}
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

          <section className='grid gap-8 px-2 py-8 sm:px-8 lg:grid-cols-[1.3fr_0.65fr] lg:px-12 lg:py-10'>
            <div className='md:block hidden'>
              <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-4 md:gap-8'>
                  <h2 className='font-poly text-lg md:text-2xl whitespace-nowrap mb-3'>Upcoming Tournaments</h2>
                  <form.AppForm>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        // void form.handleSubmit()
                      }}>
                      <form.AppField name='search'>
                        {(field) => (
                          <field.TextField
                            id='search'
                            icon='search'
                            type='search'
                            placeholder='Search'
                            autoFocus={false}
                            required={false}
                            className='h-10 md:min-w-72'
                          />
                        )}
                      </form.AppField>
                    </form>
                  </form.AppForm>
                </div>

                <div className='flex items-center gap-4 text-sm text-[#1d2824]/60'>
                  <Link className='hidden _flex items-center gap-1' href='/tournaments'>
                    <span className='font-okx font-medium text-slate-500 dark:text-slate-200'>view more</span>
                    <Icon
                      name='chevron-right'
                      className='size-4 text-slate-500 dark:text-slate-200 opacity-80 -mb-0.5'
                    />
                  </Link>
                </div>
              </div>
              <GamesList data={gamesList} />
            </div>
            <aside className='rounded-[28px] bg-white/62 p-5 shadow-[0_24px_70px_rgba(31,62,46,0.12)] backdrop-blur-xl sm:p-6'>
              <div className='flex items-center justify-between gap-4'>
                <h2 className='font-poly text-2xl leading-none'>Pinatubo Course</h2>
                <button
                  className='flex size-12 items-center justify-center rounded-full bg-white/85 text-[#1d2824]'
                  type='button'
                  aria-label='Open course map'>
                  <Icon name='compass-fill' className='size-6 -rotate-112 text-[#934040]' />
                </button>
              </div>
              <div className='md:flex items-center'>
                <GolfCourse />
                <div className='grid grid-cols-3 md:grid-cols-1 gap-4'>
                  {courseStats.map((stat) => (
                    <div key={stat.label} className='pb-4 text-center'>
                      <p className='text-sm leading-5 text-[#1d2824]/45'>{stat.label}</p>
                      <p className='mt-2 font-poly text-3xl leading-none'>
                        {stat.value}
                        <span className='ml-1 font-sans text-sm font-medium text-[#1d2824]/65'>{stat.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className='hidden _grid gap-5 sm:grid-cols-[minmax(0,1fr)_128px] lg:grid-cols-[minmax(0,1fr)_132px]'>
                <div className='relative size-97.5 overflow-hidden rounded-[24px] bg-[#edf4ef] shadow-inner'>
                  {/*<div
                    className='absolute inset-x-9 bottom-8 top-5 rotate-[-5deg] bg-[radial-gradient(circle_at_42%_28%,#eef5c8_0_4%,transparent_5%),radial-gradient(circle_at_62%_36%,#f3e6c8_0_5%,transparent_6%),radial-gradient(circle_at_44%_56%,#edf4c6_0_4%,transparent_5%),linear-gradient(145deg,#8fbf69,#4f8f55_45%,#2d6b43)] shadow-[inset_0_0_32px_rgba(19,63,35,0.35),0_18px_38px_rgba(34,75,45,0.28)] size-80'
                    style={{ borderRadius: '46% 54% 48% 52% / 34% 38% 62% 66%' }}
                  />*/}
                  <span className='absolute left-[49%] top-[28%] size-3 rounded-full bg-white shadow' />
                  <span className='absolute left-[57%] top-[46%] size-3 rounded-full bg-white shadow' />
                  <span className='absolute left-[45%] top-[64%] size-3 rounded-full bg-white shadow' />
                  <span className='absolute right-[19%] top-[32%] flex size-9 items-center justify-center rounded-full bg-[#ef4b20] text-white shadow-lg'>
                    <Icon name='flag-fill' className='size-4' />
                  </span>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
