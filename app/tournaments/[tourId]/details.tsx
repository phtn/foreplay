import Link from 'next/link'

import { findTournament, SectionTitle, TournamentHero } from '@/components/protected/tournament-experience'
import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface TourDetailProps {
  tourId: string
}

export default function TourDetail({ tourId }: TourDetailProps) {
  const tournament = findTournament(tourId)
  const tournamentFacts = tournament.overviewFacts ?? [
    { label: 'Format', value: tournament.formatLabel },
    { label: 'Date', value: tournament.dateLabel },
    { label: 'Venue', value: tournament.venue },
    { label: 'Slots', value: tournament.slotsLabel }
  ]

  return (
    <div className='space-y-4 md:space-y-8'>
      <TournamentHero
        eyebrow={tournament.statusLabel}
        title={tournament.title}
        description={tournament.description}
        venueLabel={tournament.venue}
        primaryHref='/entries'
        secondaryHref='/tournaments'
        primaryLabel='Reserve this entry'
        secondaryLabel='Back to tournaments'
        teeTimeAt={tournament.teeTimeAt}
        teeTimeLabel={tournament.teeTimeLabel}
        prizes={tournament.prizes}
        events={tournament.events}
        specialGuests={tournament.specialGuests}
        metrics={[
          { label: 'Venue', value: tournament.venue, icon: 'location' },
          { label: 'Date', value: tournament.dateLabel, icon: 'calendar' },
          { label: 'Entry fee', value: tournament.feeLabel, icon: 'trophy' },
          { label: 'Field size', value: tournament.slotsLabel, icon: 'person-multiple' }
        ]}
      />

      <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <div className='space-y-4'>
          <SectionTitle
            eyebrow='Tournament details'
            title='Everything a golfer needs before paying'
            description='Keep the rules, the divisions, and the value proposition in one clean flow.'
          />

          <Card className='border-border/70'>
            <CardHeader>
              <CardTitle className='text-xl'>Tournament overview</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-3'>
                {tournamentFacts.map((item) => (
                  <div
                    key={item.label}
                    className='grid gap-2 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-[180px_1fr] sm:items-center'>
                    <p className='text-xs uppercase tracking-[0.24em] text-muted-foreground'>{item.label}</p>
                    <p className='font-medium'>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className='flex flex-wrap gap-2'>
                {tournament.divisions.map((division) => (
                  <Badge key={division} variant='outline' size='sm' radius='full' className='border-border/70'>
                    {division}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {tournament.partnerReasons?.length ? (
            <Card className='border-border/70'>
              <CardHeader>
                <CardTitle className='text-xl'>Why partners sponsor this event</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-4 sm:grid-cols-3'>
                {tournament.partnerReasons.map((reason) => (
                  <div key={reason.title} className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                    <div className='flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
                      <Icon name='check' className='size-4' />
                    </div>
                    <h3 className='mt-4 font-semibold'>{reason.title}</h3>
                    <p className='mt-2 text-sm leading-6 text-muted-foreground'>{reason.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {tournament.sponsorshipTiers?.length ? (
            <Card className='border-border/70 bg-linear-to-br from-primary/8 via-background to-amber-500/5'>
              <CardHeader>
                <CardTitle className='text-xl'>Corporate sponsorship</CardTitle>
              </CardHeader>
              <CardContent className='space-y-5'>
                {tournament.partnerPitch ? (
                  <p className='max-w-3xl text-sm leading-7 text-muted-foreground'>{tournament.partnerPitch}</p>
                ) : null}
                <div className='grid gap-3 sm:grid-cols-2'>
                  {tournament.sponsorshipTiers.slice(0, 4).map((tier) => (
                    <div key={tier.name} className='rounded-2xl border border-border/60 bg-card p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='font-semibold'>{tier.name}</p>
                          <p className='mt-1 text-sm text-muted-foreground'>{tier.playingAccess}</p>
                        </div>
                        <Badge variant='secondary' radius='full' className='bg-primary/10 text-primary'>
                          {tier.investmentLabel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full gap-2 sm:w-auto')}
                  href={`/tournaments/${tournament.id}/sponsorship`}>
                  View sponsor packages
                  <Icon name='arrow-right' className='size-4' />
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Card className='border-border/70 bg-linear-to-br from-primary/8 via-background to-amber-500/5'>
            <CardHeader>
              <CardTitle className='text-xl'>Why this entry feels premium</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4 sm:grid-cols-2'>
              {[
                'A clean premium field with clear division structure.',
                'Entry is visible, direct, and easy to complete.',
                'Players know the venue, the date, and the format before they commit.',
                'The page is built to convert curiosity into payment.'
              ].map((item) => (
                <div key={item} className='flex gap-3 rounded-2xl border border-border/60 bg-card p-4'>
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                    <Icon name='check' className='size-4' />
                  </div>
                  <p className='text-sm text-muted-foreground'>{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          <Card className='border-border/70 md:sticky md:top-24'>
            <CardHeader>
              <CardTitle className='text-xl'>Entry summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2 rounded-3xl bg-primary/8 p-5'>
                <p className='text-xs uppercase tracking-[0.24em] text-primary/80'>Entry fee</p>
                <p className='font-heading text-4xl font-black tracking-tight'>{tournament.feeLabel}</p>
                <p className='text-sm text-muted-foreground'>Secure your slot before the field closes.</p>
              </div>
              <div className='space-y-3 text-sm'>
                {[
                  'Real-time field status',
                  'Division selection',
                  'Receipt upload for payment verification',
                  'Pairings and leaderboard access after confirmation'
                ].map((item) => (
                  <div key={item} className='flex items-start gap-3'>
                    <Icon name='check' className='mt-0.5 size-4 text-primary' />
                    <span className='text-muted-foreground'>{item}</span>
                  </div>
                ))}
              </div>
              <div className='flex flex-wrap gap-3'>
                <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2')} href='/entries'>
                  Reserve now
                  <Icon name='arrow-right' className='size-4' />
                </Link>
                <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} href='/records'>
                  See leaderboard
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/70'>
            <CardHeader>
              <CardTitle className='text-xl'>What happens next</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {[
                'Choose your division and confirm the slot.',
                'Upload payment proof.',
                'Receive pairings and final event reminders.'
              ].map((step, index) => (
                <div key={step} className='flex gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4'>
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary'>
                    {index + 1}
                  </div>
                  <p className='text-sm text-muted-foreground'>{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
