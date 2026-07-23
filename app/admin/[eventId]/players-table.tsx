import type { Doc } from '@/convex/_generated/dataModel'
import {
  type EventSubscriptionTableRow,
  PlayersDataTable
} from './players-data-table'
import { StatHeader } from './stat-header'

interface EventSubscriptionsProps {
  eventId: string
  subscriptions: EventSubscription[]
}

type EventSubscription = Doc<'subscriptions'> & {
  receiptImageUrl: string | null
}

const toCount = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : 0
}

const toTableRow = (
  subscription: EventSubscription
): EventSubscriptionTableRow => ({
  subscriptionId: subscription._id,
  createdAt: subscription._creationTime,
  reference:
    subscription.txn_ref_no ??
    subscription.form_id ??
    subscription._id,
  contactEmail: subscription.contact_email ?? null,
  teamName: subscription.team_name ?? 'Team pending',
  totalPlayers: toCount(subscription.total_players),
  totalCheckedIn: toCount(subscription.total_checked_in),
  paymentAmount: subscription.payment_amount ?? null,
  paymentStatus: subscription.payment_status,
  subscriptionStatus: subscription.status ?? 'pending_payment',
  confirmer:
    subscription.confirmed_by_name ??
    subscription.confirmed_by_email ??
    subscription.confirmed_by_id ??
    null,
  confirmedAt: subscription.confirmed_at ?? null,
  receiptUrl: subscription.receiptImageUrl,
  canUndo: Boolean(subscription.admin_status_change_id),
  tickets: [],
  adminRemarks: subscription.admin_remarks ?? ''
})

export const EventSubscriptions = ({
  eventId,
  subscriptions
}: EventSubscriptionsProps) => {
  const counts = subscriptions.reduce(
    (acc, subscription) => {
      const status = subscription.status ?? 'pending_payment'
      acc.total += 1

      if (status === 'payment_review') {
        acc.review += 1
      } else if (status === 'cancelled') {
        acc.cancelled += 1
      } else if (
        subscription.payment_status === 'paid' ||
        status === 'confirmed'
      ) {
        acc.confirmed += 1
      } else {
        acc.pending += 1
      }

      return acc
    },
    {
      total: 0,
      pending: 0,
      review: 0,
      confirmed: 0,
      cancelled: 0
    }
  )
  const rows = subscriptions.map(toTableRow)

  return (
    <section aria-label='Event players' className='w-full'>
      <StatHeader counts={counts} />
      <PlayersDataTable eventId={eventId} rows={rows} />
    </section>
  )
}
