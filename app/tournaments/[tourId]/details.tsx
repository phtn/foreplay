import Link from 'next/link'

import { SectionTitle, TournamentHero } from '@/components/protected/tournament-experience'
import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { formatRegistrationFee, formatSlotsLabel, getPublicationLabel, timeFormatter } from '@/utils/formatters'
import type { TournamentRegistrationAction } from './registration-action'

interface TourDetailProps {
  tournament: Doc<'tournaments'>
  registrationAction: TournamentRegistrationAction | null
}

export default function TourDetail({ tournament, registrationAction }: TourDetailProps) {
  const eventDate = new Date(tournament.gate_open_at)
  const dateLabel = tournament.event_date
  const feeLabel = formatRegistrationFee(tournament.registration_fee)
  const slotsLabel = formatSlotsLabel(tournament.registered_slots, tournament.slots_limit)
  const teeTimeLabel = `${dateLabel} at ${timeFormatter.format(eventDate)}`
  const tournamentFacts = tournament.overview_facts ?? []

  return (
    <div className='space-y-4 md:space-y-8'>
      <TournamentHero
        darkButton
        eyebrow={getPublicationLabel(tournament.published) === 'Published' ? 'OPEN ENTRY' : ''}
        title={tournament.title}
        description={tournament.description ?? ''}
        venueLabel={tournament.venue}
        primaryHref={`/tournaments/${tournament.id}/entry`}
        primaryLabel='Register Now'
        secondaryLabel={tournament.support?.phone}
        secondaryHref={`tel:${tournament.support?.phone}`}
        teeTimeAt={eventDate.toISOString()}
        teeTimeLabel={teeTimeLabel}
        updateLabel={registrationAction?.updateLabel}
        updateHref={registrationAction?.updateHref}
        metrics={[
          { label: 'Venue', value: tournament.venue, icon: 'location' },
          { label: 'Date', value: dateLabel, icon: 'calendar' },
          { label: 'Entry fee', value: feeLabel, icon: 'trophy' },
          { label: 'Field size', value: slotsLabel, icon: 'person-multiple' }
        ]}
      />

      <div className='mt-16 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]'>
        <div className='space-y-9'>
          <div className='px-2'>
            <SectionTitle
              eyebrow='Good to know'
              title='Tournament Overview'
              description='Observe Golf Course rules at all times.'
            />
          </div>
          <Card className='border border-slate-400/20 dark:border-slate-500/80 dark:bg-slate-500/20 shadow-none p-0'>
            <CardContent className='space-y-4 px-0'>
              <div className='grid divide-y divide-border/80 dark:divide-slate-400/25 rounded-2xl border border-border/60'>
                {tournamentFacts.map((item) => (
                  <div
                    key={item.label}
                    className='grid gap-2 hover:bg-slate-200/60 dark:hover:bg-slate-500/50 px-4 py-5 md:py-6 sm:grid-cols-[180px_1fr] sm:items-center'>
                    <p className='font-okx font-semibold text-sm md:text-xs uppercase md:tracking-widest tracking-wider'>
                      {item.label}
                    </p>
                    <p className='font-ios flex items-center space-x-1 md:space-x-5'>
                      <Icon name='chevron-right' className='size-3 text-primary' />
                      <span>{item.value}</span>
                    </p>
                  </div>
                ))}
                {tournament.support && (
                  <div
                    key={tournament.support.phone}
                    className='grid gap-2 hover:bg-slate-200/60 dark:hover:bg-slate-500/50 px-4 py-5 md:py-6 sm:grid-cols-[180px_1fr] sm:items-center'>
                    <p className='font-okx font-semibold text-sm md:text-xs uppercase md:tracking-widest tracking-wider'>
                      {tournament.support.title}
                    </p>
                    <p className='font-ios flex items-center space-x-1 md:space-x-5'>
                      <Icon name='chevron-right' className='size-3 text-primary' />
                      <p className='font-ios space-x-2 md:space-x-1'>
                        <span>{tournament.support.phone}</span>
                        <span>&middot;</span>
                        <span>{tournament.support.email}</span>
                        <span>&middot;</span>
                        <span className='capitalize'>{tournament.support.name}</span>
                      </p>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card className='border border-slate-500/80 bg-slate-100/50 dark:bg-slate-500/20 p-0'>
            <CardContent className='space-y-4 p-0'>
              <div className='space-y-4 p-4'>
                <p className='text-xs uppercase tracking-widest'>Entry fee</p>
                <p className='font-poly font-medium text-2xl'>
                  PHP {tournament.registration_fee.toLocaleString()}{' '}
                  <span className='px-1 font-normal opacity-0'> entry</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border border-border/40 dark:bg-slate-500/50'>
            <CardHeader className='md:mt-2 border-b border-border/50 dark:border-slate-500 border-dashed'>
              <CardTitle className='font-poly text-primary dark:text-foreground text-lg sm:text-xl tracking-[-0.02em] text-center'>
                Steps to book your entry
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2.25'>
              {[
                'Click Register Now.',
                'Fill out the entry form.',
                'Pay with QR or Bank transfer',
                'Upload Proof of Payment',
                'Go to My Entries to view ticket.'
              ].map((step, index) => (
                <div key={step} className='flex items-center gap-4 py-4'>
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/80 dark:bg-background/80 dark:text-primary font-semibold text-background'>
                    <span className='font-poly text-lg'>{index + 1}</span>
                  </div>
                  <p className='text-base md:text-base text-foreground'>{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const PremiumEntry = () => {
  return (
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
  )
}

interface SponsorshipTier {
  name: string
  investmentLabel: string
  playingAccess: string
  accessNote?: string
  benefits: string[]
}

interface SponsorshipProps {
  id: string
  partnerPitch: string | undefined
  sponsorshipTiers: SponsorshipTier[] | undefined
}

export const Sponsorship = ({ id, partnerPitch, sponsorshipTiers }: SponsorshipProps) => {
  return (
    <Card className='border-border/70 bg-linear-to-br from-primary/8 via-background to-amber-500/5'>
      <CardHeader>
        <CardTitle className='text-xl'>Corporate sponsorship</CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        {partnerPitch ? <p className='max-w-3xl text-sm leading-7 text-muted-foreground'>{partnerPitch}</p> : null}
        <div className='grid gap-3 sm:grid-cols-2'>
          {sponsorshipTiers?.slice(0, 4).map((tier) => (
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
          href={`/tournaments/${id}/sponsorship`}>
          View sponsor packages
          <Icon name='arrow-right' className='size-4' />
        </Link>
      </CardContent>
    </Card>
  )
}
