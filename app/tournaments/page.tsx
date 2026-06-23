import ProtectedLayout from '@/ctx/protected'
import Link from 'next/link'

import { featuredTournament, SectionTitle, TournamentHero } from '@/components/protected/tournament-experience'
import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

const tournamentFilters = ['All events', 'Open fields', 'Championships', 'This month']

export default function TournamentsPage() {
  return (
    <ProtectedLayout>
      <div className='space-y-4 md:space-y-8'>
        <TournamentHero
          eyebrow='0|120'
          title='Seoul of Manila Golf Tournament 2026'
          description='Present the field, the price, and the format in a way that makes the next click feel obvious.'
          venueLabel={featuredTournament.venue}
          primaryHref='/subscriptions'
          // secondaryHref='/'
          primaryLabel='My Entries'
          secondaryLabel=''
          teeTimeAt={featuredTournament.teeTimeAt}
          teeTimeLabel={featuredTournament.teeTimeLabel}
          prizes={featuredTournament.prizes}
          events={featuredTournament.events}
          specialGuests={featuredTournament.specialGuests}
          metrics={[
            { label: 'Fields live', value: '3', icon: 'flag-line' },
            { label: 'Entry window', value: '48h', icon: 'lock' },
            { label: 'Players queued', value: '132', icon: 'golf-flag' }
          ]}
        />

        <div className='flex flex-wrap gap-2 py-6'>
          {tournamentFilters.map((filter, index) => (
            <Badge
              key={filter}
              variant={index === 0 ? 'secondary' : 'outline'}
              size='default'
              radius='full'
              className={cn('font-okx font-normal bg-background text-foreground/70 tracking-wide', {
                'border-border/70 bg-foreground text-background': index === 0
              })}>
              {filter}
            </Badge>
          ))}
        </div>

        <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          {/*<div className='space-y-4'>
            <SectionTitle
              eyebrow='Open entries'
              title='Make the premium event impossible to ignore'
              description='The cards should read like invitations: venue first, payoff second, then a clear route to register.'
            />
            <div className='space-y-4'>
              {tournamentList.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
*/}
          <div className='hidden space-y-4'>
            <SectionTitle eyebrow='Why the field buys' title='Package the experience, not just the bracket' />
            <Card className='border-border/70 bg-muted/20'>
              <CardHeader>
                <CardTitle className='text-xl'>Included with entry</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {[
                  'Official tee time and pairings',
                  'Live leaderboard visibility',
                  'Division-based competition',
                  'Payment verification and receipt tracking',
                  'A premium event page with all details in one place'
                ].map((item) => (
                  <div key={item} className='flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4'>
                    <div className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                      <Icon name='check' className='size-4' />
                    </div>
                    <p className='text-sm text-muted-foreground'>{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className='border-border/70'>
              <CardContent className='space-y-4 p-5'>
                <p className='text-xs uppercase tracking-[0.24em] text-primary/80'>Next move</p>
                <h3 className='font-heading text-2xl font-bold'>Turn the listing into a ticket sale</h3>
                <p className='text-sm text-muted-foreground'>
                  Add a clear CTA and keep the entry fee visible everywhere the golfer can hesitate.
                </p>
                <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2')} href='/entries'>
                  Check my registration
                  <Icon name='arrow-right' className='size-4' />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
