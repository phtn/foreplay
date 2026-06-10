import Link from 'next/link'
import type { ReactNode } from 'react'

import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

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
  id: 'green-jacket-invitational',
  title: 'Green Jacket Invitational',
  venue: 'Mt Malarayat Golf & Country Club',
  dateLabel: 'June 12, 2026',
  feeLabel: '₱2,500 entry',
  slotsLabel: '120 players',
  formatLabel: '36-hole stroke play',
  statusLabel: 'Entry open',
  description:
    'A polished tournament experience for serious amateurs and club players who want a premium field, well-run logistics, and a clean path to pay, confirm, and play.',
  divisions: ['Championship', 'Amateur', 'Ladies', 'Senior']
}

export const tournamentList: TournamentSpotlight[] = [
  featuredTournament,
  {
    id: 'coastal-classic-open',
    title: 'Coastal Classic Open',
    venue: 'Southlinks Golf Club',
    dateLabel: 'July 4, 2026',
    feeLabel: '₱1,800 entry',
    slotsLabel: '96 players',
    formatLabel: 'Stableford qualifier',
    statusLabel: 'Selling fast',
    description: 'Fast-moving weekend field with a lighter format and a strong sponsor prize table.',
    divisions: ['Open', 'Amateur', 'Net']
  },
  {
    id: 'mid-summer-championship',
    title: 'Mid-Summer Championship',
    venue: 'The Orchard Golf & Country Club',
    dateLabel: 'August 9, 2026',
    feeLabel: '₱3,500 entry',
    slotsLabel: '144 players',
    formatLabel: 'Two-day championship',
    statusLabel: 'Premium field',
    description: 'Built for players chasing a bigger purse, tighter tee sheets, and a more competitive bracket.',
    divisions: ['Championship', 'Ladies', 'Senior']
  }
]

export const protectedEntries: ProtectedEntry[] = [
  {
    id: 'entry-001',
    tournament: 'Green Jacket Invitational',
    venue: 'Mt Malarayat Golf & Country Club',
    dateLabel: 'June 12, 2026',
    status: 'Pending payment',
    step: 'Upload receipt to lock your tee time.',
    feeLabel: '₱2,500',
    division: 'Amateur'
  },
  {
    id: 'entry-002',
    tournament: 'Coastal Classic Open',
    venue: 'Southlinks Golf Club',
    dateLabel: 'July 4, 2026',
    status: 'Confirmed',
    step: 'Pairings will arrive 24 hours before tee off.',
    feeLabel: '₱1,800',
    division: 'Open'
  },
  {
    id: 'entry-003',
    tournament: 'Mid-Summer Championship',
    venue: 'The Orchard Golf & Country Club',
    dateLabel: 'August 9, 2026',
    status: 'Needs verification',
    step: 'Your receipt is waiting for manual review.',
    feeLabel: '₱3,500',
    division: 'Championship'
  }
]

export const leaderboardRows: LeaderboardRow[] = [
  { rank: 1, name: 'M. Reyes', club: 'Alabang Country Club', score: '-6', note: 'Birdie run on the back nine' },
  { rank: 2, name: 'A. Santos', club: 'The Orchard', score: '-4', note: 'Best driving accuracy in field' },
  { rank: 3, name: 'J. Lim', club: 'Southlinks', score: '-3', note: 'Clean weekend with zero doubles' },
  { rank: 4, name: 'P. Dela Cruz', club: 'Mt Malarayat', score: '-2', note: 'Best short-game save rate' },
  { rank: 5, name: 'R. Navarro', club: 'Manila Southwoods', score: '-1', note: 'Steady scoring under pressure' }
]

export const homeMetrics = [
  { label: 'Ready', value: '132', icon: 'golf-flag' as const },
  // { label: 'Average fill rate', value: '86%', icon: 'trophy' as const },
  { label: 'Registrations', value: '24', icon: 'golf-tee' as IconName },
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
      <div className='flex items-end justify-between gap-4'>
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
  primaryHref,
  secondaryHref,
  primaryLabel,
  secondaryLabel,
  metrics,
  primaryAction
}: TournamentHeroProps) {
  return (
    <Card className='relative overflow-hidden border-border bg-card shadow-[0_24px_80px_-1px_rgba(15,23,42,0.45)]'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(234,179,8,0.16),transparent_80%)]' />
      <div className='absolute inset-0 bg-[url("/noise.svg")] size-screen opacity-30' />
      <CardContent className='relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.8fr_0.9fr] lg:p-10'>
        <div className='space-y-8'>
          <div className='flex flex-wrap items-center gap-4'>
            <Badge variant='secondary' radius='full' className='bg-primary/5 text-primary rounded-md'>
              {eyebrow}
            </Badge>
            <span className='text-xs uppercase tracking-wider text-foreground/70'>MEMBERS-ONLY</span>
          </div>
          <div className='space-y-4'>
            <h1 className='max-w-2xl font-poly font-semibold text-3xl tracking-tight text-balance sm:text-4xl lg:text-5xl'>
              {title}
            </h1>
            <p className='max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base'>{description}</p>
          </div>
          <div className='bg-background/80 px-3 max-w-xl rounded-lg border border-dashed'>
            <div className='flex items-center h-10 space-x-4 border-b border-dashed'>
              <Icon name='flag-line' className='size-4' />
              <span className='font-ios'>Mt Malarayat Golf & Country Club</span>
              <span className='px-3 opacity-60'>Batangas</span>
            </div>
            <div className='flex items-center h-10 space-x-4'>
              <Icon name='flag-line' className='size-4' />
              <span className='font-ios'>530 AM June 24, 2026</span>
              <span className='px-3 opacity-60'>Wenesday</span>
            </div>
          </div>
          <div className='flex items-end flex-wrap h-16 gap-3'>
            {primaryAction ?? (
              <Link
                className={cn(buttonVariants({ size: 'xl' }), 'bg-foreground px-8 text-sm font-poly font-medium')}
                href={primaryHref}>
                {primaryLabel}
              </Link>
            )}
            <Link className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'font-poly')} href={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-3 lg:grid-cols-1'>
          {metrics.map((metric) => (
            <Card key={metric.label} size='sm' className='border-border/60 bg-background relative z-40 lg:px-4'>
              <CardContent className='flex items-center gap-4 lg:gap-6 lg:py-4'>
                <div className='flex size-6 lg:size-10 items-center justify-center text-accent'>
                  <Icon name={metric.icon ?? 'trophy'} className='size-6 lg:size-10' />
                </div>
                <div>
                  <p className='text-2xl font-bold tracking-tight'>{metric.value}</p>
                  <p className='text-xs text-muted-foreground'>{metric.label}</p>
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
        <div className='flex items-start justify-between gap-4'>
          <div className='space-y-3'>
            <Badge variant='secondary' size='sm' radius='full' className='bg-primary/10 text-primary'>
              {tournament.statusLabel}
            </Badge>
            <CardTitle className='text-2xl'>{tournament.title}</CardTitle>
            <CardDescription className='max-w-xl'>{tournament.description}</CardDescription>
          </div>
          <Badge variant='outline' size='sm' radius='full' className='border-primary/20 bg-primary/5 text-primary'>
            {tournament.slotsLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='grid gap-5 p-6 sm:grid-cols-[1.1fr_0.9fr]'>
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
      <CardFooter className='flex items-center justify-between border-t border-border/60 bg-muted/20 py-4'>
        <div>
          <p className='text-sm text-muted-foreground'>Entry fee</p>
          <p className='text-lg font-semibold text-primary'>{tournament.feeLabel}</p>
        </div>
        <Link className={cn(buttonVariants({ size: 'sm' }), 'gap-2')} href={`/tournaments/${tournament.id}`}>
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
        <div className='flex items-start justify-between gap-4'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{entry.dateLabel}</p>
            <h3 className='font-heading text-xl font-bold'>{entry.tournament}</h3>
            <p className='text-sm text-muted-foreground'>{entry.venue}</p>
          </div>
          <Badge variant={statusVariant} size='sm' radius='full'>
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
      <CardContent className='space-y-3 pb-6'>
        {rows.map((row) => (
          <div
            key={row.rank}
            className='flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3'>
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
            <Badge variant='secondary' size='sm' radius='full' className='bg-foreground text-background'>
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
            <p className='text-xs uppercase tracking-[0.24em] text-muted-foreground'>{metric.label}</p>
            <p className='font-heading text-3xl font-bold tracking-tight'>{metric.value}</p>
            <p className='text-sm text-muted-foreground'>{metric.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
