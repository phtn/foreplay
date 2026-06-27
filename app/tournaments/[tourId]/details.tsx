import { fetchQuery } from 'convex/nextjs'
import Link from 'next/link'

import {
  findTournament,
  SectionTitle,
  TournamentHero,
  type TournamentSpotlight
} from '@/components/protected/tournament-experience'
import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface TourDetailProps {
  tourId: string
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency',
  currencyDisplay: 'code'
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  timeZone: 'Asia/Manila',
  year: 'numeric'
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila'
})

function formatRegistrationFee(value: number, sponsorshipTiers?: Doc<'tournaments'>['sponsorship_tiers']) {
  if (value > 0) {
    return `${pesoFormatter.format(value)}`
  }

  const lowestSponsorTier = sponsorshipTiers
    ?.map((tier) => Number(tier.investment_label.replace(/[^\d.]/g, '')))
    .filter((amount) => Number.isFinite(amount) && amount > 0)
    .sort((left, right) => left - right)[0]

  return lowestSponsorTier
    ? `Sponsor packages from ${pesoFormatter.format(lowestSponsorTier)}`
    : 'Entry details pending'
}

function formatSlotsLabel(tournament: Doc<'tournaments'>) {
  if (tournament.slots_limit) {
    return tournament.registered_slots > 0
      ? `${tournament.registered_slots}/${tournament.slots_limit} players`
      : `${tournament.slots_limit} slots`
  }

  return tournament.registered_slots > 0 ? `${tournament.registered_slots} registered` : 'Slots pending'
}

function getFormatLabel(tournament: Doc<'tournaments'>) {
  const formatFact = tournament.overview_facts?.find((fact) => fact.label.toLowerCase() === 'format')
  return formatFact?.value ?? tournament.divisions?.[0] ?? 'Tournament'
}

function getStatusLabel(tournament: Doc<'tournaments'>) {
  if (tournament.sponsorship_tiers?.length) {
    return '120 slots'
  }

  return tournament.published === false ? 'Coming soon' : 'Entry open'
}

function mapConvexTournament(tournament: Doc<'tournaments'>, fallback: TournamentSpotlight): TournamentSpotlight {
  const eventDate = new Date(tournament.gate_open_at)
  const dateLabel = tournament.event_date || dateFormatter.format(eventDate)
  const teeTimeLabel = `${dateLabel} at ${timeFormatter.format(eventDate)}`

  return {
    ...fallback,
    id: tournament.id ?? tournament._id ?? fallback.id,
    title: tournament.title,
    venue: tournament.venue,
    dateLabel,
    feeLabel: formatRegistrationFee(tournament.registration_fee, tournament.sponsorship_tiers),
    slotsLabel: formatSlotsLabel(tournament),
    formatLabel: getFormatLabel(tournament),
    statusLabel: getStatusLabel(tournament),
    description: tournament.description ?? fallback.description,
    divisions: tournament.divisions ?? fallback.divisions,
    teeTimeAt: new Date(tournament.gate_open_at).toISOString(),
    teeTimeLabel,
    overviewFacts: tournament.overview_facts?.map((fact) => ({ label: fact.label, value: fact.value })),
    partnerPitch: tournament.partner_pitch,
    partnerReasons: tournament.partner_reasons?.map((reason) => ({
      title: reason.title,
      description: reason.description
    })),
    sponsorshipTiers: tournament.sponsorship_tiers?.map((tier) => ({
      name: tier.name,
      investmentLabel: tier.investment_label,
      playingAccess: tier.playing_access,
      accessNote: tier.access_note,
      benefits: tier.benefits
    })),
    sponsorContact:
      tournament.sponsor_contact_phone || tournament.sponsor_contact_email
        ? {
            phoneLabel: tournament.sponsor_contact_phone ?? fallback.sponsorContact?.phoneLabel ?? '',
            emailLabel: tournament.sponsor_contact_email ?? fallback.sponsorContact?.emailLabel ?? ''
          }
        : fallback.sponsorContact
  }
}

export default async function TourDetail({ tourId }: TourDetailProps) {
  const fallbackTournament = findTournament(tourId)
  const convexTournament = await fetchQuery(api.tournaments.q.getByTournamentId, { id: tourId })
  const tournament = convexTournament ? mapConvexTournament(convexTournament, fallbackTournament) : fallbackTournament
  const tournamentFacts = tournament.overviewFacts ?? [
    { label: 'Format', value: tournament.formatLabel },
    { label: 'Date', value: tournament.dateLabel },
    { label: 'Venue', value: tournament.venue },
    { label: 'Slots', value: tournament.slotsLabel }
  ]

  return (
    <div className='space-y-4 md:space-y-8'>
      <TournamentHero
        darkButton
        eyebrow={tournament.statusLabel}
        title={tournament.title}
        description={tournament.description}
        venueLabel={tournament.venue}
        primaryHref={`/tournaments/${tournament.id}/entry`}
        // secondaryHref={`/tournaments/${tournament.id}/sponsorship`}
        // secondaryLabel='Sponsor Event'
        primaryLabel='Book Entry'
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

      <div className='mt-16 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]'>
        <div className='space-y-9'>
          <SectionTitle
            eyebrow='Good to know'
            title='Tournament Overview'
            description='Observe Golf Course rules at all times.'
          />

          <Card className='border border-slate-400/20 dark:border-slate-500/80 dark:bg-slate-500/20 shadow-none p-0'>
            <CardContent className='space-y-4 px-0 border-white'>
              <div className='grid divide-y divide-border/80 dark:divide-slate-400/25 rounded-2xl border border-border/60'>
                {tournamentFacts.map((item) => (
                  <div
                    key={item.label}
                    className='grid gap-2 hover:bg-slate-200/60 dark:hover:bg-slate-500/50 px-4 py-5 sm:grid-cols-[180px_1fr] sm:items-center'>
                    <p className='text-okx text-xs uppercase tracking-widest'>{item.label}</p>
                    <p className='font-ios '>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card className='border border-slate-500/80 bg-slate-200/50 dark:bg-slate-500/20 p-0'>
            <CardContent className='space-y-4 p-0'>
              <div className='space-y-5 p-4'>
                <p className='text-xs uppercase tracking-widest'>Entry fee</p>
                <p className='font-okx font-medium text-2xl'>
                  {tournament.feeLabel} <span className='px-1 font-normal opacity-60'> entry</span>
                </p>
                {/*<p className='font-display text-xs text-foreground/80 tracking-wide leading-0'>
                  Secure your slot before the field closes.
                </p>*/}
              </div>
            </CardContent>
          </Card>

          <Card className='border border-border/40 dark:bg-slate-500/50'>
            <CardHeader>
              <CardTitle className='font-poly text-primary text-2xl text-center mt-2'>
                Steps to book your entry
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {[
                'Select how many entries you want to book.',
                'Pay the entry fee and upload proof of payment.',
                'Register players to confirm the slots.'
              ].map((step, index) => (
                <div key={step} className='flex gap-3 py-4.5'>
                  <div className='flex size-7.5 shrink-0 items-center justify-center rounded-full bg-foreground/80 font-semibold text-background'>
                    <span className='font-poly text-lg'>{index + 1}</span>
                  </div>
                  <p className='text-sm md:text-base text-foreground'>{step}</p>
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

/*
<Card className='border-border/70 hidden'>
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
*/
