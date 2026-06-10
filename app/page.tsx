import ProtectedLayout from '@/ctx/protected'
import Link from 'next/link'

import {
  featuredTournament,
  homeMetrics,
  SectionTitle,
  TournamentCard,
  TournamentHero
} from '@/components/protected/tournament-experience'
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
      <div className='space-y-8'>
        <TournamentHero
          eyebrow='SEASON'
          title='Sell the tee time before the first swing.'
          description='A premium tournament landing experience for golfers who want to buy in fast, see the purse, and trust the event is being run like a proper championship.'
          primaryHref='/tournaments'
          secondaryHref='/entries'
          primaryLabel='Browse open entries'
          secondaryLabel='View my tickets'
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
      </div>
    </ProtectedLayout>
  )
}
