import { api } from '@/convex/_generated/api'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Icon } from '@/lib/icons'
import { toRegistrationTicketData, type RegistrationTicketData } from '@/lib/tickets/registration-ticket'
import { formatEventDate, formatGateOpenTime, formatSlotsLabel } from '@/utils/formatters'
import { fetchQuery } from 'convex/nextjs'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventHeader } from './event-header'
import { PlayersDataTable, type EventSubscriptionTableRow } from './players-data-table'

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

const toCount = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
}

export default async function EventPage({ params }: EventPageProps) {
  const [{ eventId }] = await Promise.all([params, requireAdminSession()])
  const [event, subscriptions, registrations] = await Promise.all([
    fetchQuery(api.tournaments.q.getByTournamentId, { id: eventId }),
    fetchQuery(api.subscriptions.q.listByTournamentId, { tournamentId: eventId }),
    fetchQuery(api.registrations.q.listByTournamentId, {
      tournamentId: eventId
    })
  ])

  if (!event) {
    notFound()
  }

  const eventDateLabel = formatEventDate(event.gate_open_at, event.event_date)
  const gateOpenTimeLabel = formatGateOpenTime(event.gate_open_at)
  const slotsLabel = formatSlotsLabel(event.registered_slots, event.slots_limit)
  const ticketsBySubscription = new Map<string, RegistrationTicketData[]>()

  for (const registration of registrations) {
    if (!registration.subscription_id) continue

    const tickets = ticketsBySubscription.get(registration.subscription_id) ?? []
    tickets.push(toRegistrationTicketData(registration, `Player ${tickets.length + 1}`))
    ticketsBySubscription.set(registration.subscription_id, tickets)
  }

  const playerRows: EventSubscriptionTableRow[] = subscriptions.map((subscription) => ({
    subscriptionId: subscription._id,
    createdAt: subscription._creationTime,
    reference: subscription.txn_ref_no ?? subscription.form_id ?? subscription._id,
    contactEmail: subscription.contact_email ?? null,
    teamName: subscription.team_name ?? 'Team pending',
    totalPlayers: toCount(subscription.total_players),
    totalCheckedIn: toCount(subscription.total_checked_in),
    paymentAmount: subscription.payment_amount ?? null,
    paymentStatus: subscription.payment_status,
    subscriptionStatus: subscription.status ?? 'pending_payment',
    confirmer:
      subscription.confirmed_by_name ?? subscription.confirmed_by_email ?? subscription.confirmed_by_id ?? null,
    confirmedAt: subscription.confirmed_at ?? null,
    receiptUrl: subscription.receiptImageUrl,
    canUndo: Boolean(subscription.admin_status_change_id),
    tickets: ticketsBySubscription.get(subscription._id) ?? [],
    adminRemarks: subscription.admin_remarks ?? ''
  }))

  return (
    <main className='space-y-0 md:space-y-4'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between px-4 pb-2 md:pb-0'>
        <div className='space-y-4 mt-4 md:mt-0 w-full'>
          <Link
            href='/admin'
            prefetch='auto'
            className='font-okx group inline-flex items-center gap-0.5 md:gap-2 text-sm text-foreground hover:underline underline-offset-4 decoration-0.5 decoration-dashed md:tracking-wider hover:text-sky-600'>
            <Icon name='chevron-down' className='size-4 rotate-45 text-sky-500 group-hover:text-sky-600' />
            Events
          </Link>

          <div className='space-y-2 w-full flex items-center justify-between'>
            <h1 className='font-poly font-medium text-xl md:text-xl'>{event.title}</h1>
            <Link href={`/admin/${eventId}/pairings`} className='flex items-center space-x-1 md:space-x-2'>
              <span className='font-poly flex items-center gap-1'>Pairings</span>
              <Icon name='document' className='size-4 opacity-80' />
            </Link>
          </div>
        </div>
      </div>

      <PlayersDataTable eventId={eventId} rows={playerRows} />
      <EventHeader
        eventDateLabel={eventDateLabel}
        gateOpenTimeLabel={gateOpenTimeLabel}
        fee={event.registration_fee}
        slotsLabel={slotsLabel}
      />
    </main>
  )
}
