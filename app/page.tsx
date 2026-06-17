'use client'

import ProtectedLayout from '@/ctx/protected'
import Link from 'next/link'

import { Loader } from '@/components/loaders/px-grid'
import {
  featuredTournament,
  homeMetrics,
  SectionTitle,
  TournamentCard,
  TournamentHero
} from '@/components/protected/tournament-experience'
import { Typewrite } from '@/components/text/typewriter'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

const sellingPoints = [
  {
    icon: 'golf-flag' as const,
    title: 'Built to fill the field',
    description: 'Clear pricing, polished registration flow, and premium positioning that gets players to commit.'
  },
  {
    icon: 'trophy' as const,
    title: 'Competition that feels serious',
    description: 'Championship framing, division structure, and leaderboard visibility give the event real weight.'
  },
  {
    icon: 'lock' as const,
    title: 'Registration with no friction',
    description: 'Entry, payment, and verification live in one place so golfers can reserve a slot without confusion.'
  }
]

export default function HomePage() {
  return (
    <ProtectedLayout>
      {/*Animating Header*/}
      <div className='relative flex items-center gap-2 text-xl font-poly pb-4'>
        <div className='relative flex size-6 aspect-square items-center justify-center rounded-full -rotate-45'>
          <Loader />
          <div className='absolute size-5 aspect-square rounded-full bg-linear-to-tl from-white/30 via-background via-62% to-background' />
        </div>
        <Typewrite text='Upcoming Events' speed={20} showCursor={false} className='text-primary' />
      </div>

      <div className='space-y-12'>
        <TournamentHero
          eyebrow='TOURNAMENT'
          title={featuredTournament.title}
          description={featuredTournament.description}
          primaryHref='/tournaments/tour-01/entry'
          secondaryHref='/entries'
          primaryLabel='Book Now'
          secondaryLabel='View my tickets'
          // primaryAction={
          //   <BookNowForm
          //     tournamentTitle={featuredTournament.title}
          //     venue={featuredTournament.venue}
          //     dateLabel={featuredTournament.dateLabel}
          //     feeLabel={featuredTournament.feeLabel}
          //     teeTimeLabel={featuredTournament.teeTimeLabel}
          //     divisionOptions={featuredTournament.divisions}
          //   />
          // }
          galleryHref='#gallery'
          teeTimeAt={featuredTournament.teeTimeAt}
          teeTimeLabel={featuredTournament.teeTimeLabel}
          prizes={featuredTournament.prizes}
          events={featuredTournament.events}
          specialGuests={featuredTournament.specialGuests}
          metrics={homeMetrics}
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4 py-8'>
          {[
            { label: 'Leader', value: 'Tom Ford', note: '15th hole' },
            { label: 'Open fields', value: '3', note: 'Currently selling this month' },
            { label: 'Players waiting', value: '132', note: 'Confirmed and pending' },
            { label: 'Sponsor value', value: 'Premium', note: 'Made to feel exclusive' }
          ].map((metric) => (
            <Card
              key={metric.label}
              size='sm'
              className='relative overflow-hidden border-border/70 bg-primary/80 px-2 py-0'>
              <div
                aria-hidden='true'
                className="pointer-events-none absolute inset-0 rounded-2xl bg-[url('/noise.svg')] bg-repeat opacity-40"
              />
              <CardContent className='relative z-10 h-full py-0'>
                <div className='space-y-2'>
                  <p className='text-xs uppercase tracking-[0.24em] text-foreground'>{metric.label}</p>
                  <p className='font-heading text-white text-3xl font-bold tracking-tight py-3'>{metric.value}</p>
                </div>
                <p className='text-base text-white/90 tracking-wide'>{metric.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='grid gap-6 lg:grid-cols-[1.15fr_0.85fr]'>
          <div className='space-y-4'>
            <SectionTitle
              eyebrow='Featured event'
              title='The one you should be pushing right now'
              description='Lead with the event that has the cleanest story, strongest purse, and the tightest registration window.'
            />
            <TournamentCard tournament={featuredTournament} />
          </div>

          <div className='space-y-4'>
            <SectionTitle
              eyebrow='Conversion path'
              title='How the entry sells itself'
              description='Give golfers a premium reason to register now, not later.'
            />
            <Card className='border-border/70 bg-muted/20'>
              <CardHeader>
                <CardTitle className='text-xl'>What the player sees</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {sellingPoints.map((point) => (
                  <div key={point.title} className='flex gap-3 rounded-2xl border border-border/60 bg-card p-4'>
                    <div className='flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                      <Icon name={point.icon} className='size-5' />
                    </div>
                    <div>
                      <h3 className='font-medium'>{point.title}</h3>
                      <p className='text-sm text-muted-foreground'>{point.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className='flex flex-wrap gap-3'>
              <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2')} href='/tournaments'>
                Explore tournaments
                <Icon name='arrow-right' className='size-4' />
              </Link>
              <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href='/records'>
                View leaderboard
              </Link>
            </div>
          </div>
        </div>

        {/*<div className='grid gap-4 lg:grid-cols-3'>
          {[
            {
              title: 'Premium course positioning',
              body: 'Lead with venue, field size, and format so the event feels like a real tournament, not a generic signup.'
            },
            {
              title: 'Payment confidence',
              body: 'Surface the fee, verification step, and tee time expectations up front to reduce drop-off.'
            },
            {
              title: 'Progressive disclosure',
              body: 'Show just enough detail to sell the entry, then let golfers drill into the full tournament page.'
            }
          ].map((item) => (
            <Card key={item.title} className='border-border/70'>
              <CardContent className='space-y-2 p-5'>
                <p className='text-xs uppercase tracking-[0.24em] text-primary/80'>Design note</p>
                <h3 className='font-heading text-xl font-bold'>{item.title}</h3>
                <p className='text-sm text-muted-foreground'>{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section id='gallery' aria-labelledby='gallery-title' className='scroll-mt-28 space-y-4'>
          <SectionTitle
            eyebrow='Accessible gallery'
            title='View the event before you register'
            description='Use the gallery to show the course, the prize table, and the people around the event without making golfers hunt for context.'
          />
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {galleryCards.map((item) => (
              <Card key={item.title} className='border-border/70 bg-card'>
                <CardContent className='space-y-4 p-5'>
                  <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                    <Icon name={item.icon} className='size-6' />
                  </div>
                  <div className='space-y-1'>
                    <h3 className='font-heading text-xl font-bold'>{item.title}</h3>
                    <p className='text-sm text-muted-foreground'>{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>*/}
      </div>
    </ProtectedLayout>
  )
}
