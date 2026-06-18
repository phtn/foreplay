import Link from 'next/link'
import type { ReactNode } from 'react'

import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export type TournamentSpotlight = {
  id: string
  title: string
  venue: string
  dateLabel: string
  feeLabel: string
  slotsLabel: string
  formatLabel: string
  statusLabel: string
  description: string
  divisions: string[]
  teeTimeAt?: string
  teeTimeLabel?: string
  prizes?: Array<string>
  events?: Array<{ label: string; detail: string }>
  specialGuests?: Array<string>
  overviewFacts?: Array<{ label: string; value: string }>
  partnerPitch?: string
  partnerReasons?: Array<{ title: string; description: string }>
  sponsorshipTiers?: Array<{
    name: string
    investmentLabel: string
    playingAccess: string
    accessNote?: string
    benefits: string[]
  }>
  sponsorContact?: {
    phoneLabel: string
    emailLabel: string
  }
}

export type ProtectedEntry = {
  id: string
  tournament: string
  venue: string
  dateLabel: string
  status: 'Confirmed' | 'Pending payment' | 'Needs verification'
  step: string
  feeLabel: string
  division: string
}

export type LeaderboardRow = {
  rank: number
  name: string
  club: string
  score: string
  note: string
}

export const featuredTournament: TournamentSpotlight = {
  id: 'som-2026',
  title: 'Seoul of Manila Golf Tournament 2026',
  venue: 'Pradera Verde Golf & Country Club, Pampanga',
  dateLabel: 'July 18, 2026',
  feeLabel: 'Sponsor packages from ₱20,000',
  slotsLabel: '100+ executives',
  formatLabel: 'System 36',
  statusLabel: 'Sponsors open',
  description:
    'A corporate golf and networking tournament built around executive access, premium brand placement, a major hole-in-one prize, and a high-value sponsor package ladder.',
  divisions: ['Corporate', 'System 36', 'Sponsor flights', 'VIP banquet'],
  teeTimeAt: '2026-07-18T07:00:00+08:00',
  teeTimeLabel: 'July 18, 2026 at 7:00 AM',
  prizes: [
    '2026 Ford Everest 4x2 Sport hole-in-one grand prize',
    '₱450,000 total cash rewards',
    'Sponsor-led activations and awards'
  ],
  events: [
    { label: 'Player arrival and sponsor check-in', detail: '6:00 AM' },
    { label: 'Shotgun start', detail: '7:00 AM' },
    { label: 'High-value networking window', detail: '5+ hours' },
    { label: 'Awards and VIP banquet', detail: 'After scoring' }
  ],
  specialGuests: ['Corporate partners', 'Business owners', 'Key executives', 'Industry leaders'],
  overviewFacts: [
    { label: 'Date & Time', value: 'July 18, 2026 | 7:00 AM Shotgun Start' },
    { label: 'Official Venue', value: 'Pradera Verde Golf & Country Club, Pampanga (Pinatubo Course)' },
    { label: 'Format', value: 'System 36 handicapping format' },
    { label: 'Hole-in-One Grand Prize', value: '2026 Ford Everest 4x2 Sport on Hole 15 Island Green' },
    { label: 'Cash Prize Purse', value: '₱450,000 total cash rewards' }
  ],
  partnerPitch:
    'Position your brand directly in front of business owners, key executives, and industry leaders through a premium golf tournament environment designed for face-to-face corporate engagement.',
  partnerReasons: [
    {
      title: 'High-value networking',
      description:
        'Secure over five hours of uninterrupted casual interaction with high-net-worth individuals, enterprise owners, and corporate executives.'
    },
    {
      title: 'Premium brand association',
      description: 'Align with prestige, athletic excellence, and a world-class championship golf facility.'
    },
    {
      title: 'Organic brand visibility',
      description:
        'A luxury SUV grand prize and major cash purse create photography, social media, and sponsor placement moments.'
    }
  ],
  sponsorshipTiers: [
    {
      name: 'Platinum',
      investmentLabel: '₱200,000',
      playingAccess: '4 Tickets',
      accessNote: '1 Full Flight',
      benefits: [
        '"Presented by [Your Brand]" co-branding on the main welcome arch.',
        'Co-naming rights on the official Ford Everest Hole-in-One field signage.',
        'Exclusive corporate logo placement across all player golf carts.',
        'Dedicated physical activation tent at high-traffic Hole 1 or Hole 18.',
        'Reserved VIP banquet table and 3-minute executive speaking slot.'
      ]
    },
    {
      name: 'Gold',
      investmentLabel: '₱100,000',
      playingAccess: '2 Tickets',
      benefits: [
        'Dedicated branding and booth setup space at a high-visibility Par 3 hole.',
        'Prominent logo on the main sponsor board, backdrops, and giveaway bags.',
        'Exclusive sponsor spotlight feature post across social media channels.'
      ]
    },
    {
      name: 'Silver',
      investmentLabel: '₱50,000',
      playingAccess: '1 Ticket',
      benefits: [
        'Shared banner signage displayed at a designated tee box or putting green.',
        'Opportunity to insert one corporate promotional item or voucher inside giveaway bags.',
        'Digital logo inclusion across all pre-event email newsletters.'
      ]
    },
    {
      name: 'Bronze',
      investmentLabel: '₱20,000',
      playingAccess: 'None',
      benefits: [
        'Official logo placement on the collective sponsor board at the clubhouse.',
        'Formal corporate acknowledgment and verbal thank-you during the awards ceremony.'
      ]
    }
  ],
  sponsorContact: {
    phoneLabel: 'Secretariat contact to be assigned',
    emailLabel: 'sponsors@seoulofmanila.example'
  }
}

export const seoulOfManilaTournament = featuredTournament

export const batangasSpringClassic: TournamentSpotlight = {
  id: 'tour-01',
  title: 'Batangas Spring Classic',
  venue: 'Mt Malarayat Golf & Country Club',
  dateLabel: 'August 8, 2026',
  feeLabel: '₱2,500 entry',
  slotsLabel: '120 players',
  formatLabel: '36-hole stroke play',
  statusLabel: 'Entry open',
  description:
    'A polished tournament experience for serious amateurs and club players who want a premium field, well-run logistics, and a clean path to pay, confirm, and play.',
  divisions: ['Championship', 'Amateur', 'Ladies', 'Senior'],
  teeTimeAt: '2026-08-08T05:30:00+08:00',
  teeTimeLabel: 'August 8, 2026 at 5:30 AM',
  prizes: ['Champion trophy', 'Best net prize', 'Closest-to-the-pin awards'],
  events: [
    { label: 'Registration opens', detail: '5:00 AM' },
    { label: 'Breakfast and bag drop', detail: '5:15 AM' },
    { label: 'Shotgun start', detail: '5:30 AM' },
    { label: 'Scoring closes', detail: '11:15 AM' },
    { label: 'Awards brunch', detail: '12:00 PM' }
  ],
  specialGuests: ['Guest starter: Liza Cruz', 'Sponsor rep: Niko Tan', 'Rules officer: Jose Mercado']
}

export const tournamentList: TournamentSpotlight[] = [
  featuredTournament,
  batangasSpringClassic,
  {
    id: 'tour-02',
    title: 'Coastal Classic Open',
    venue: 'Southlinks Golf Club',
    dateLabel: 'September 5, 2026',
    feeLabel: '₱1,800 entry',
    slotsLabel: '96 players',
    formatLabel: 'Stableford qualifier',
    statusLabel: 'Selling fast',
    description: 'Fast-moving weekend field with a lighter format and a strong sponsor prize table.',
    divisions: ['Open', 'Amateur', 'Net'],
    teeTimeAt: '2026-09-05T06:00:00+08:00',
    teeTimeLabel: 'September 5, 2026 at 6:00 AM',
    prizes: ['Top gross prize', 'Net podium', 'Sponsor raffle pack'],
    events: [
      { label: 'Check-in', detail: '4:45 AM' },
      { label: 'First tee', detail: '6:00 AM' },
      { label: 'Live scoring update', detail: 'Every 3 holes' },
      { label: 'Award ceremony', detail: 'After final card' }
    ],
    specialGuests: ['Host: Clara Delos Santos', 'Sponsor lead: Miguel Tan']
  },
  {
    id: 'tour-03',
    title: 'Mid-Summer Championship',
    venue: 'The Orchard Golf & Country Club',
    dateLabel: 'October 10, 2026',
    feeLabel: '₱3,500 entry',
    slotsLabel: '144 players',
    formatLabel: 'Two-day championship',
    statusLabel: 'Premium field',
    description: 'Built for players chasing a bigger purse, tighter tee sheets, and a more competitive bracket.',
    divisions: ['Championship', 'Ladies', 'Senior'],
    teeTimeAt: '2026-10-10T05:45:00+08:00',
    teeTimeLabel: 'October 10, 2026 at 5:45 AM',
    prizes: ['Overall champion', 'Low amateur', 'Division podium'],
    events: [
      { label: 'Pro-am mixer', detail: 'Night before' },
      { label: 'Round one tee off', detail: '5:45 AM shotgun' },
      { label: 'Cut line posted', detail: 'After round one' },
      { label: 'Final round', detail: 'Next day' }
    ],
    specialGuests: ['Tournament chair: Paolo Reyes', 'Sponsor rep: Anne Lim']
  },
  {
    id: 'tour-04',
    title: 'Sunset Links Invitational',
    venue: 'Splendido Taal Country Club',
    dateLabel: 'November 14, 2026',
    feeLabel: '₱2,000 entry',
    slotsLabel: '84 players',
    formatLabel: '18-hole match play',
    statusLabel: 'New listing',
    description:
      'A compact invitational built around match play brackets, tighter fields, and a premium twilight finish.',
    divisions: ['Open', 'Senior'],
    teeTimeAt: '2026-11-14T13:30:00+08:00',
    teeTimeLabel: 'November 14, 2026 at 1:30 PM',
    prizes: ['Bracket champion', 'Runner-up prize', 'Putting contest award'],
    events: [
      { label: 'Lobby check-in', detail: '12:30 PM' },
      { label: 'Bracket reveal', detail: '1:00 PM' },
      { label: 'Match play start', detail: '1:30 PM' },
      { label: 'Sunset awards', detail: '5:45 PM' }
    ],
    specialGuests: ['Starter: Nina Bautista', 'Sponsor host: Carlo Dizon']
  }
]

export const protectedEntries: ProtectedEntry[] = [
  {
    id: 'entry-001',
    tournament: 'Seoul of Manila Golf Tournament 2026',
    venue: 'Pradera Verde Golf & Country Club, Pampanga',
    dateLabel: 'July 18, 2026',
    status: 'Pending payment',
    step: 'Confirm your sponsor flight or player access with the secretariat.',
    feeLabel: '₱20,000+',
    division: 'Corporate'
  },
  {
    id: 'entry-002',
    tournament: 'Batangas Spring Classic',
    venue: 'Mt Malarayat Golf & Country Club',
    dateLabel: 'August 8, 2026',
    status: 'Confirmed',
    step: 'Pairings will arrive 24 hours before tee off.',
    feeLabel: '₱2,500',
    division: 'Amateur'
  },
  {
    id: 'entry-003',
    tournament: 'Coastal Classic Open',
    venue: 'Southlinks Golf Club',
    dateLabel: 'September 5, 2026',
    status: 'Needs verification',
    step: 'Your receipt is waiting for manual review.',
    feeLabel: '₱1,800',
    division: 'Open'
  },
  {
    id: 'entry-004',
    tournament: 'Mid-Summer Championship',
    venue: 'The Orchard Golf & Country Club',
    dateLabel: 'October 10, 2026',
    status: 'Confirmed',
    step: 'Pairings and cart assignments arrive the day before.',
    feeLabel: '₱3,500',
    division: 'Championship'
  }
]

export const leaderboardRows: LeaderboardRow[] = [
  { rank: 1, name: 'M. Reyes', club: 'Alabang Country Club', score: '-6', note: 'Birdie run on the back nine' },
  { rank: 2, name: 'A. Santos', club: 'The Orchard', score: '-4', note: 'Best driving accuracy in field' },
  { rank: 3, name: 'J. Lim', club: 'Southlinks', score: '-3', note: 'Clean weekend with zero doubles' },
  { rank: 4, name: 'P. Dela Cruz', club: 'Mt Malarayat', score: '-2', note: 'Best short-game save rate' },
  { rank: 5, name: 'R. Navarro', club: 'Manila Southwoods', score: '-1', note: 'Steady scoring under pressure' },
  { rank: 6, name: 'K. Dizon', club: 'Splendido Taal', score: 'E', note: 'Late surge on the closing stretch' }
]

export const homeMetrics = [
  { label: 'Ready', value: '132', icon: 'golf-flag' as const },
  // { label: 'Average fill rate', value: '86%', icon: 'trophy' as const },
  { label: 'Max', value: '200', icon: 'golf-tee' as IconName },
  { label: 'Purse', value: '₱120K', icon: 'coins' as IconName }
]

export const recordMetrics = [
  { label: 'Best round', value: '-8', note: 'J. Lim at Southlinks' },
  { label: 'Average score', value: '+2.4', note: 'Across 18 holes' },
  { label: 'Fairways hit', value: '71%', note: 'Field average this month' },
  { label: 'Birdie streak', value: '6', note: 'Held by M. Reyes' }
]

export function findTournament(id: string): TournamentSpotlight {
  return tournamentList.find((tournament) => tournament.id === id) ?? featuredTournament
}

export function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className='space-y-2'>
      <p className='text-xs font-semibold uppercase tracking-[0.28em] text-primary/80'>{eyebrow}</p>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4'>
        <h2 className='font-heading text-2xl font-bold tracking-tight sm:text-3xl'>{title}</h2>
      </div>
      {description ? <p className='max-w-2xl text-sm text-muted-foreground sm:text-base'>{description}</p> : null}
    </div>
  )
}

interface TournamentHeroProps {
  eyebrow: string
  title: string
  description: string
  venueLabel?: string
  primaryHref: string
  secondaryHref: string
  primaryLabel: string
  secondaryLabel: string
  metrics: Array<{ label: string; value: string; icon?: IconName }>
  primaryAction?: ReactNode
  galleryHref?: string
  teeTimeAt?: string
  teeTimeLabel?: string
  prizes?: Array<string>
  events?: Array<{ label: string; detail: string }>
  specialGuests?: Array<string>
}

export function TournamentHero({
  eyebrow,
  title,
  description,
  venueLabel,
  primaryHref,
  secondaryHref,
  primaryLabel,
  secondaryLabel,
  metrics,
  primaryAction,
  teeTimeLabel
}: TournamentHeroProps) {
  return (
    <Card className='relative overflow-hidden border-border mask-luminance shadow-[0_24px_80px_-1px_rgba(15,23,42,0.15)]'>
      <div className='absolute rounded-full size-250 overflow-hidden -right-36 -top-54'>
        <Image fill src='/som-logo-dark.svg' alt='logo' className='opacity-60 w-auto aspect-auto' />
      </div>
      <div className='absolute inset-0 dark:bg-[radial-gradient(circle_at_top_right,rgba(180,180,180,0.1),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(150,150,80,0.16),transparent_80%)] bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(234,179,8,0.16),transparent_80%)]' />
      <div className='absolute inset-0 bg-[url("/noise.svg")] size-auto opacity-10' />
      <CardContent className='relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.8fr_0.9fr] lg:gap-8 lg:p-8'>
        <div className='space-y-6 sm:space-y-8'>
          <div className='flex flex-wrap items-center gap-4'>
            <Badge variant='secondary' radius='full' className='bg-primary/5 text-primary rounded-md uppercase'>
              {eyebrow}
            </Badge>
            {/*<span className='text-xs uppercase tracking-wider text-foreground/70'>MEMBERS-ONLY</span>*/}
          </div>
          <div className='space-y-4'>
            <h1 className='max-w-2xl text-balance font-poly text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl'>
              {title}
            </h1>
            <p className='max-w-xl text-sm leading-7 text-foreground sm:text-base'>{description}</p>
          </div>
          <div className='max-w-xl rounded-lg border border-dashed bg-background/80 dark:bg-foreground/10 backdrop-blur-2xl px-3 sm:px-4'>
            <div className='flex items-center gap-2 border-b border-dashed py-2 text-sm tracking-tight'>
              <Icon name='location' className='size-4' />
              <p className='min-w-0 flex-1 font-ios'>{venueLabel ?? 'Mt. Malarayat Golf & Country Club'}</p>
              <p className='shrink-0 opacity-60'>Venue</p>
            </div>
            <div className='flex items-center gap-2 py-2 tracking-tight'>
              <Icon name='clock' className='size-4' />
              <span className='font-ios text-sm'>{teeTimeLabel ?? 'July 18, 2026 at 7:00 AM'}</span>
              <span className='px-2 text-xs opacity-60'>TEE</span>
            </div>
          </div>
          <div className='flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:w-auto'>
            {primaryAction ?? (
              <Link
                className={cn(
                  buttonVariants({ size: 'xl' }),
                  'w-full bg-primary text-white px-8 text-sm font-poly font-medium sm:w-auto'
                )}
                href={primaryHref}>
                {primaryLabel}
              </Link>
            )}
            <Link
              className={cn(buttonVariants({ variant: 'ghost', size: 'xl' }), 'w-full font-poly sm:w-auto')}
              href={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <div className='hidden _grid gap-3 grid-cols-3 md:grid-cols-1 place-items-end'>
          {metrics.map((metric) => (
            <Card
              key={metric.label}
              size='sm'
              className='border-border/60 bg-background/80 backdrop-blur-2xl relative z-40 lg:py-0 lg:px-2 p-0 min-w-80 max-w-80'>
              <CardContent className='flex items-center gap-2 lg:gap-5 lg:py-0 p-0'>
                <div className='flex size-6 lg:size-10 items-center justify-center text-hermes'>
                  <Icon name={metric.icon ?? 'trophy'} className='size-6 lg:size-7' />
                </div>
                <div>
                  <p className='font-poly font-semibold text-base tracking-tight'>{metric.value}</p>
                  <p className='font-ios text-muted-foreground text-xs uppercase'>{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function TournamentCard({ tournament }: { tournament: TournamentSpotlight }) {
  return (
    <Card className='group my-4 py-0 overflow-hidden border-border/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_30px_60px_-35px_rgba(15,23,42,0.55)]'>
      <CardHeader className='border-b py-4 border-border/60 bg-linear-to-br from-primary/8 via-background to-amber-500/5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
          <div className='space-y-3'>
            <Badge variant='secondary' size='sm' radius='full' className='bg-primary/10 text-primary'>
              {tournament.statusLabel}
            </Badge>
            <CardTitle className='text-2xl'>{tournament.title}</CardTitle>
            <CardDescription className='max-w-xl'>{tournament.description}</CardDescription>
          </div>
          <Badge
            variant='outline'
            size='sm'
            radius='full'
            className='w-fit border-primary/20 bg-primary/5 text-primary'>
            {tournament.slotsLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='grid gap-5 p-4 sm:grid-cols-[1.1fr_0.9fr] sm:p-6'>
        <div className='space-y-3 text-sm text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <Icon name='tag-chevron' className='size-4 text-primary' />
            <span>{tournament.venue}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Icon name='golf-flag' className='size-4 text-primary' />
            <span>{tournament.dateLabel}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Icon name='trophy' className='size-4 text-primary' />
            <span>{tournament.formatLabel}</span>
          </div>
        </div>
        <div className='flex flex-wrap gap-2 self-start'>
          {tournament.divisions.map((division) => (
            <Badge key={division} variant='outline' size='sm' radius='full' className='border-border/70 bg-background'>
              {division}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className='flex flex-col gap-3 border-t border-border/60 bg-muted/20 py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm text-muted-foreground'>Entry fee</p>
          <p className='text-lg font-semibold text-primary'>{tournament.feeLabel}</p>
        </div>
        <Link
          className={cn(buttonVariants({ size: 'sm' }), 'w-full gap-2 sm:w-auto')}
          href={`/tournaments/${tournament.id}`}>
          View entry
          <Icon name='arrow-right' className='size-4' />
        </Link>
      </CardFooter>
    </Card>
  )
}

export function EntryCard({ entry }: { entry: ProtectedEntry }) {
  const statusVariant: 'success-light' | 'warning-light' | 'info-light' =
    entry.status === 'Confirmed' ? 'success-light' : entry.status === 'Pending payment' ? 'warning-light' : 'info-light'

  return (
    <Card className='border-border/70'>
      <CardContent className='space-y-4 p-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{entry.dateLabel}</p>
            <h3 className='font-heading text-xl font-bold'>{entry.tournament}</h3>
            <p className='text-sm text-muted-foreground'>{entry.venue}</p>
          </div>
          <Badge variant={statusVariant} size='sm' radius='full' className='w-fit'>
            {entry.status}
          </Badge>
        </div>
        <div className='grid gap-3 sm:grid-cols-3'>
          <div className='rounded-2xl bg-muted/40 p-3'>
            <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Division</p>
            <p className='mt-1 font-medium'>{entry.division}</p>
          </div>
          <div className='rounded-2xl bg-muted/40 p-3'>
            <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Fee</p>
            <p className='mt-1 font-medium'>{entry.feeLabel}</p>
          </div>
          <div className='rounded-2xl bg-muted/40 p-3'>
            <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Next step</p>
            <p className='mt-1 font-medium'>{entry.step}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function LeaderboardCard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <Card className='border-border/70'>
      <CardHeader>
        <CardTitle className='text-xl'>Live leaderboard</CardTitle>
        <CardDescription>Current field shape and the players setting the pace.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3 px-4 pb-4 sm:px-6 sm:pb-6'>
        {rows.map((row) => (
          <div
            key={row.rank}
            className='flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center'>
            <div className='flex size-10 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary'>
              {row.rank}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                <p className='font-medium'>{row.name}</p>
                <span className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>{row.club}</span>
              </div>
              <p className='text-sm text-muted-foreground'>{row.note}</p>
            </div>
            <Badge variant='secondary' size='sm' radius='full' className='w-fit bg-foreground text-background'>
              {row.score}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: string; note: string }> }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {metrics.map((metric) => (
        <Card key={metric.label} size='sm' className='border-border/70 bg-primary'>
          <CardContent className='space-y-2 p-4'>
            <p className='text-xs uppercase tracking-[0.24em] text-white'>{metric.label}</p>
            <p className='font-heading text-3xl font-bold tracking-tight'>{metric.value}</p>
            <p className='text-sm text-muted-foreground'>{metric.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
