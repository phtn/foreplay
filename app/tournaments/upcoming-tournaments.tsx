import { featuredTournament } from '@/components/protected/tournament-experience'
import { buttonVariants } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { formatRegistrationFee, formatSlotsLabel, timeFormatter } from '@/utils/formatters'
import { fetchQuery } from 'convex/nextjs'
import Link from 'next/link'
import { connection } from 'next/server'

type ListedTournament = Doc<'tournaments'> & { id: string }

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'Asia/Manila' })
const dayFormatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', timeZone: 'Asia/Manila' })
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Manila' })

async function loadUpcomingTournaments() {
  await connection()
  const tournaments = await fetchQuery(api.tournaments.q.listTournaments)
  const now = Date.now()
  return tournaments
    .filter((tournament): tournament is ListedTournament =>
      Boolean(
        tournament.id &&
        tournament.id !== featuredTournament.id &&
        tournament.published !== false &&
        Number.isFinite(tournament.gate_open_at) &&
        tournament.gate_open_at >= now
      )
    )
    .sort((left, right) => left.gate_open_at - right.gate_open_at)
}

export async function UpcomingTournaments() {
  const upcoming = await loadUpcomingTournaments()

  return (
    <section aria-labelledby='upcoming-tournaments-heading' className='space-y-6 pb-10 pt-6 md:pt-8'>
      <div className='flex flex-wrap items-end justify-between gap-4 px-1'>
        <div className='space-y-2'>
          <p className='font-ios text-xs uppercase tracking-widest text-hermes dark:text-primary'>Explore the field</p>
          <h2 id='upcoming-tournaments-heading' className='font-poly text-2xl font-semibold sm:text-3xl'>
            Upcoming Tournaments
          </h2>
          <p className='text-sm text-muted-foreground sm:text-base'>Find your next event and see what is open for entry.</p>
        </div>
        {upcoming.length > 0 ? (
          <p className='font-ios text-xs uppercase tracking-wider text-muted-foreground'>
            {upcoming.length} {upcoming.length === 1 ? 'event' : 'events'} ahead
          </p>
        ) : null}
      </div>

      {upcoming.length ? (
        <ul className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {upcoming.map((tournament) => (
            <li key={tournament._id} className='min-w-0'>
              <UpcomingTournamentCard tournament={tournament} />
            </li>
          ))}
        </ul>
      ) : (
        <div className='flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center'>
          <Icon name='trophy-line' className='size-9 text-muted-foreground' />
          <div className='space-y-1'>
            <p className='font-poly text-lg'>No upcoming tournaments yet</p>
            <p className='text-sm text-muted-foreground'>New events will appear here when they are announced.</p>
          </div>
        </div>
      )}
    </section>
  )
}

function UpcomingTournamentCard({ tournament }: { tournament: ListedTournament }) {
  const eventDate = new Date(tournament.gate_open_at)
  const isFull = tournament.slots_limit !== undefined && tournament.registered_slots >= tournament.slots_limit

  return (
    <article className='flex h-full flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md sm:p-6'>
      <div className='flex items-start gap-4'>
        <time
          dateTime={eventDate.toISOString()}
          className='flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-foreground text-background'>
          <span className='font-ios text-[11px] uppercase tracking-widest'>{monthFormatter.format(eventDate)}</span>
          <span className='font-poly text-2xl leading-none'>{dayFormatter.format(eventDate)}</span>
        </time>
        <div className='min-w-0 flex-1 space-y-1'>
          <p className='font-ios text-[11px] uppercase tracking-wider text-muted-foreground'>
            {weekdayFormatter.format(eventDate)} · {timeFormatter.format(eventDate)}
          </p>
          <h3 className='font-poly text-lg leading-snug text-foreground sm:text-xl'>{tournament.title}</h3>
        </div>
      </div>

      <div className='space-y-3'>
        <p className='flex items-start gap-2 text-sm text-muted-foreground'>
          <Icon name='map-pin' className='mt-0.5 size-4 shrink-0' />
          <span>{tournament.venue}</span>
        </p>
        {tournament.description ? (
          <p className='line-clamp-2 text-sm leading-6 text-muted-foreground'>{tournament.description}</p>
        ) : null}
      </div>

      <div className='mt-auto space-y-4 border-t border-border/70 pt-4'>
        <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm'>
          <div>
            <p className='font-ios text-[10px] uppercase tracking-wider text-muted-foreground'>Entry fee</p>
            <p className='mt-1 font-medium text-foreground'>{formatRegistrationFee(tournament.registration_fee)}</p>
          </div>
          <div className='text-end'>
            <p className='font-ios text-[10px] uppercase tracking-wider text-muted-foreground'>Field</p>
            <p className='mt-1 text-foreground'>{formatSlotsLabel(tournament.registered_slots, tournament.slots_limit)}</p>
          </div>
        </div>
        <Link
          href={`/tournaments/${encodeURIComponent(tournament.id)}`}
          className={cn(buttonVariants({ size: 'lg', variant: isFull ? 'outline' : 'default' }), 'w-full justify-between rounded-lg')}>
          <span>{isFull ? 'View tournament' : 'Explore tournament'}</span>
          <Icon name='arrow-right' className='size-4' />
        </Link>
      </div>
    </article>
  )
}
