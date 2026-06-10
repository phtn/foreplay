import ProtectedLayout from '@/ctx/protected'
import Link from 'next/link'

import {
  homeMetrics,
  SectionTitle,
  TournamentCard,
  TournamentHero,
  TournamentSpotlight
} from '@/components/protected/tournament-experience'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

const featuredTournament: TournamentSpotlight = {
  id: 'featured-01',
  title: 'Featured Tournament',
  venue: 'Foreplay Park',
  dateLabel: 'July 4, 2026',
  feeLabel: '$500',
  slotsLabel: '100 slots',
  formatLabel: 'Standard',
  statusLabel: 'Open',
  description: '',
  divisions: ['Open', 'Amateur', 'Net'],
  teeTimeAt: '2026-07-04T06:45:00+08:00',
  teeTimeLabel: 'July 4, 2026 at 6:45 AM',
  prizes: ['Title sponsor trophy', 'Skill contest awards', 'Sponsor gift packs'],
  events: [
    { label: 'Registration opens', detail: '5:15 AM' },
    { label: 'Round one tee off', detail: '6:45 AM shotgun' },
    { label: 'Winner photo', detail: 'Immediately after scoring' }
  ],
  specialGuests: ['Guest judge: Liza Cruz', 'Sponsor rep: Niko Tan', 'Club captain: Jose Mercado']
}
const galleryCards = [
  {
    icon: 'golf-flag' as const,
    title: 'Course view',
    description: 'Show the fairways, the green, and the setup golfers will actually play.'
  },
  {
    icon: 'trophy' as const,
    title: 'Prize wall',
    description: 'Make the purse and sponsor awards visible before the first click.'
  },
  {
    icon: 'flag-fill' as const,
    title: 'Event flow',
    description: 'Check-in, shotgun start, and awards stage in one clean sequence.'
  },
  {
    icon: 'book-open' as const,
    title: 'Special guests',
    description: 'Surface hosts, starters, and featured guests as part of the event story.'
  }
]

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
      <div className='space-y-16'>
        {/*V2 Hero here*/}
        <div className='h-6 flex items-center space-x-2 px-3'>
          <Icon name='chevrons-right' />
          <span className='font-display text-foreground/70'>Upcoming Tournaments</span>
        </div>
        <TournamentHero
          eyebrow='TOURNAMENT'
          title='Batangas Open'
          description='A premium tournament landing experience for golfers who want to buy in fast, see the purse, and trust the event is being run like a proper championship.'
          primaryHref='/tournaments'
          secondaryHref='/entries'
          primaryLabel='Book Now'
          secondaryLabel='View my tickets'
          galleryHref='#gallery'
          teeTimeAt={featuredTournament.teeTimeAt}
          teeTimeLabel={featuredTournament.teeTimeLabel}
          prizes={featuredTournament.prizes}
          events={featuredTournament.events}
          specialGuests={featuredTournament.specialGuests}
          metrics={homeMetrics}
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {[
            { label: 'Open fields', value: '3', note: 'Currently selling this month' },
            { label: 'Average entry', value: '₱2.5K', note: 'Entry price positioning' },
            { label: 'Players waiting', value: '132', note: 'Confirmed and pending' },
            { label: 'Sponsor value', value: 'Premium', note: 'Made to feel exclusive' }
          ].map((metric) => (
            <Card key={metric.label} size='sm' className='border-border/70'>
              <CardContent className='space-y-2 p-4'>
                <p className='text-xs uppercase tracking-[0.24em] text-muted-foreground'>{metric.label}</p>
                <p className='font-heading text-3xl font-bold tracking-tight'>{metric.value}</p>
                <p className='text-sm text-muted-foreground'>{metric.note}</p>
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

        <div className='grid gap-4 lg:grid-cols-3'>
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
        </section>
      </div>
    </ProtectedLayout>
  )
}
