import { LinkTitle, SectionTitle } from '@/components/layouts/title'
import { api } from '@/convex/_generated/api'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { toRegistrationTicketData, type RegistrationTicketData } from '@/lib/tickets/registration-ticket'
import { formatEventDate } from '@/utils/formatters'
import { fetchQuery } from 'convex/nextjs'
import { notFound } from 'next/navigation'
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
  const ticketsBySubscription = new Map<string, RegistrationTicketData[]>()

  for (const registration of registrations) {
    if (!registration.subscription_id) continue

    const tickets = ticketsBySubscription.get(registration.subscription_id) ?? []
    tickets.push(
      toRegistrationTicketData(registration, `Player ${tickets.length + 1}`, {
        eventDate: eventDateLabel,
        eventName: event.title,
        eventSupportPhone: event.support?.phone,
        venue: event.venue
      })
    )
    ticketsBySubscription.set(registration.subscription_id, tickets)
  }

  const playerRows: EventSubscriptionTableRow[] = subscriptions.map((subscription) => ({
    subscriptionId: subscription._id,
    createdAt: subscription._creationTime,
    userId: subscription.user_id,
    reference: subscription.txn_ref_no ?? subscription.form_id ?? subscription._id,
    contactEmail: subscription.contact_email ?? null,
    contactPhone: subscription.contact_phone ?? null,
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
    adminRemarks: subscription.admin_remarks ?? '',
    updatedAt: subscription.updatedAt ?? null
  }))

  return (
    <main className='space-y-0 md:space-y-0'>
      <div className='flex items-center justify-between px-2 md:px-2 pb-0'>
        <SectionTitle eyebrow='Events' href='/admin' />

        <div className='w-full h-10 flex items-start justify-center overflow-hidden'>
          <h1 className='font-poly font-medium text-base sm:text-xl md:text-xl whitespace-nowrap'>{event.title}</h1>
        </div>

        <LinkTitle title={undefined} eyebrow='pairings' icon='document' href={`/admin/${eventId}/pairings`} />
      </div>
      <PlayersDataTable eventId={eventId} eventTitle={event.title} rows={playerRows} />
    </main>
  )
}
