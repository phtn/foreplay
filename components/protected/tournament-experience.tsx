import { Badge } from '@/components/reui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { formatEventDate, formatGateOpenTime } from '@/utils/formatters'
import Image from 'next/image'
import Link from 'next/link'
import { Activity, type ReactNode } from 'react'

export type TournamentSpotlight = {
  id: string
  title: string
  venue: string
  venueCoordinates?: {
    latitude: number
    longitude: number
  }
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

export const protectedEntries: ProtectedEntry[] = [
  {
    id: 'entry-001',
    tournament: 'Seoul of Manila Golf Tournament 2026',
    venue: 'Pradera Verde Golf & Country Club, Pampanga',
    dateLabel: 'October 22, 2026',
    status: 'Pending payment',
    step: 'Confirm your sponsor flight or player access with the secretariat.',
    feeLabel: '₱20,000+',
    division: 'Corporate'
  }
]

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
    <div className='space-y-3'>
      <p className='text-xs font-semibold uppercase tracking-[0.28em] dark:text-primary text-hermes'>{eyebrow}</p>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4'>
        <h2 className='font-poly font-semibold text-xl sm:text-2xl'>{title}</h2>
      </div>
      {description ? (
        <p className='max-w-2xl text-sm text-muted-foreground sm:text-base leading-none italic'>{description}</p>
      ) : null}
    </div>
  )
}

type TournamentOverviewData = Pick<Doc<'tournaments'>, 'event_date' | 'gate_open_at' | 'venue' | 'overview_facts' | 'support'>

export function TournamentOverview({ tournament }: { tournament: TournamentOverviewData }) {
  const dateAndTime = Number.isFinite(tournament.gate_open_at)
    ? `${formatEventDate(tournament.gate_open_at, '')} | ${formatGateOpenTime(tournament.gate_open_at)}`
    : tournament.event_date
  const facts = new Map([
    ['date & time', { label: 'Date & Time', value: dateAndTime }],
    ['official venue', { label: 'Official Venue', value: tournament.venue }]
  ])

  for (const { label, value } of tournament.overview_facts ?? []) {
    if (label.trim() && value.trim()) {
      facts.set(label.trim().toLowerCase(), { label, value })
    }
  }

  const support = tournament.support
  const contact = [support?.phone, support?.email, support?.name].map((value) => value?.trim()).filter(Boolean).join(' · ')

  return (
    <section className='space-y-9'>
      <div className='px-2'>
        <SectionTitle
          eyebrow='Good to know'
          title='Tournament Overview'
          description='Observe Golf Course rules at all times.'
        />
      </div>
      <Card className='border border-slate-400/20 dark:border-slate-500/80 dark:bg-slate-500/20 shadow-none p-0'>
        <CardContent className='px-0'>
          <dl className='grid overflow-hidden divide-y divide-border/80 dark:divide-slate-400/25 rounded-2xl border border-border/60'>
            {Array.from(facts, ([key, fact]) => <TournamentOverviewRow key={key} {...fact} />)}
            {contact ? <TournamentOverviewRow label={support?.title?.trim() || 'Support'} value={contact} /> : null}
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}

function TournamentOverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid gap-2 hover:bg-slate-200/60 dark:hover:bg-slate-500/50 px-4 py-5 md:py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center'>
      <dt className='font-okx font-semibold text-sm md:text-xs uppercase md:tracking-widest tracking-wider wrap-break-word'>
        {label}
      </dt>
      <dd className='font-ios flex items-center gap-1 md:gap-5'>
        <Icon name='chevron-right' aria-hidden='true' className='size-3 shrink-0 text-primary' />
        <span className='min-w-0 wrap-break-word'>{value}</span>
      </dd>
    </div>
  )
}

interface TournamentHeroProps {
  heroLogoSrc?: string | null
  coverPhotoSrc?: string | null
  eyebrow: string
  title: string
  description?: string
  venueLabel?: string
  primaryHref: string
  secondaryHref?: string
  primaryLabel: string
  secondaryLabel?: string
  metrics?: Array<{ label: string; value: string; icon?: IconName }>
  primaryAction?: ReactNode
  teeTimeLabel?: string
  darkButton?: boolean
  updateLabel?: string
  updateHref?: string
}

export function TournamentHero({
  heroLogoSrc,
  coverPhotoSrc,
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
  teeTimeLabel,
  darkButton = false,
  updateLabel,
  updateHref
}: TournamentHeroProps) {
  return (
    <div>
      <Card className='relative rounded-3xl overflow-hidden border border-slate-400 dark:border-background mask-luminance shadow-[0_24px_80px_-1px_rgba(15,23,42,0.15)] p-0'>
        {coverPhotoSrc ? (
          <Image fill alt='' src={coverPhotoSrc} sizes='100vw' unoptimized className='object-cover' />
        ) : null}
        <div className='absolute inset-0 bg-linear-to-r from-background via-background/75 to-background/30' />
        <div className='absolute inset-0 bg-[url("/noise.svg")] size-auto opacity-10' />
        <CardContent
          className={cn('relative grid min-h-64 items-center gap-6 p-5 sm:p-6 lg:p-8', {
            'md:grid-cols-[1.8fr_1fr]': heroLogoSrc
          })}>
          <div className='min-w-0 space-y-5'>
            {eyebrow ? (
              <Badge variant='secondary' radius='full' className='bg-primary/5 rounded-md uppercase tracking-widest'>
                {eyebrow}
              </Badge>
            ) : null}
            <h1 className='max-w-2xl text-balance font-poly text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl'>
              {title}
            </h1>
            {description ? <p className='max-w-lg text-sm leading-6 sm:text-base'>{description}</p> : null}
            {venueLabel || teeTimeLabel ? (
              <div className='max-w-md divide-y divide-dashed rounded-lg border border-dashed bg-background/80 px-3'>
                {venueLabel ? (
                  <div className='flex items-center gap-2 py-2 text-sm'>
                    <Icon name='location' className='size-4 shrink-0' />
                    <p className='font-ios'>{venueLabel}</p>
                  </div>
                ) : null}
                {teeTimeLabel ? (
                  <div className='flex items-center gap-2 py-2 text-sm'>
                    <Icon name='clock' className='size-4 shrink-0' />
                    <span className='font-ios'>{teeTimeLabel}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className='hidden md:flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:w-auto'>
              <Activity mode={updateLabel && updateHref !== undefined ? 'visible' : 'hidden'}>
                <Link
                  id='update-and-resume'
                  className={cn(
                    buttonVariants({ size: '2xl' }),
                    'w-full hover:bg-foreground/80 backdrop-blur-3xl text-orange-200 px-8 text-sm font-poly font-medium sm:w-auto flex items-center',
                    { 'bg-foreground/80 dark:bg-background/80': darkButton }
                  )}
                  href={updateHref ?? '#'}>
                  <span>{updateLabel}</span>
                  <Icon name='chevron-right' className='size-4.5' />
                </Link>
              </Activity>
              {primaryAction ?? (
                <Link
                  className={cn(
                    buttonVariants({ size: '2xl' }),
                    ' bg-[#333637] hover:bg-[#333637]/90 text-[#e3e3e3] dark:hover:bg-[#333637]/90 font-poly text-base',
                    { 'bg-foreground/80 dark:bg-background/10 dark:hover:[#1c1e23]/98!': darkButton }
                  )}
                  href={primaryHref}>
                  <span>{primaryLabel}</span>
                  <Icon name='chevron-right' className='size-4.5' />
                </Link>
              )}
              {secondaryHref && (
                <Link
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'xl' }),
                    'w-full font-poly sm:w-auto bg-slate-200/5 hover:bg-white hover:text-slate-900'
                  )}
                  href={secondaryHref}>
                  <Icon name='service' className='size-8' />
                  <div className='block ml-1'>
                    <p className='tracking-wider'>{secondaryLabel}</p>
                    <span className='text-sm font-okx font-normal tracking-wide'>Customer Support</span>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {heroLogoSrc ? (
            <div className='relative order-first mx-auto aspect-video w-full max-w-80 md:order-none'>
              <Image fill alt='' src={heroLogoSrc} sizes='320px' unoptimized className='object-contain' />
            </div>
          ) : null}
          <div className='hidden _grid gap-3 grid-cols-3 md:grid-cols-1 place-items-end'>
            {metrics?.map((metric) => (
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
      <div className='md:hidden flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:w-auto mt-4'>
        <Activity mode={updateLabel && updateHref !== undefined ? 'visible' : 'hidden'}>
          <Link
            id='update-and-resume'
            className={cn(
              buttonVariants({ size: '2xl' }),
              'w-full hover:bg-foreground/80 backdrop-blur-3xl text-orange-200 px-8 text-sm font-poly font-medium sm:w-auto flex items-center h-18',
              { 'bg-foreground/80 dark:bg-background/80': darkButton }
            )}
            href={updateHref ?? '#'}>
            <span>{updateLabel}</span>
            <Icon name='chevron-right' className='size-4.5' />
          </Link>
        </Activity>
        {primaryAction ?? (
          <Link
            className={cn(
              buttonVariants({ size: '2xl' }),
              'w-full hover:bg-primary/80 backdrop-blur-3xl text-white px-8 text-sm font-poly font-medium sm:w-auto flex items-center h-18',
              { 'bg-primary dark:bg-primary': darkButton }
            )}
            href={primaryHref}>
            <span className='text-lg'>{primaryLabel}</span>
            <Icon name='chevron-right' className='size-4.5' />
          </Link>
        )}
        {secondaryHref && (
          <Link
            className={cn(
              buttonVariants({ variant: 'secondary', size: '2xl' }),
              'w-full font-poly sm:w-auto bg-foreground/5 dark:bg-slate-700/5 hover:bg-white hover:text-slate-900 dark:hover:text-white dark:hover:bg-neutral-900 h-18'
            )}
            href={secondaryHref}>
            <Icon name='service' className='size-8' />
            <div className='block ml-1'>
              <p className='tracking-wider'>{secondaryLabel}</p>
              <span className='text-sm font-okx font-normal tracking-wider'>Customer Support</span>
            </div>
          </Link>
        )}
      </div>
    </div>
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
