export const adminSubscriptionStatusActions = [
  'pending_payment',
  'payment_review',
  'confirm_payment',
  'cancelled'
] as const

export type AdminSubscriptionStatusAction =
  (typeof adminSubscriptionStatusActions)[number]

export type SubscriptionPaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'

export interface SubscriptionStatusSnapshot {
  payment_status: SubscriptionPaymentStatus
  status?: string
  confirmed_by_id?: string
  confirmed_by_email?: string
  confirmed_by_name?: string
  confirmed_at?: number
}

interface AdminActor {
  id: string
  email?: string
  name?: string
}

const addOptionalConfirmationFields = (
  snapshot: SubscriptionStatusSnapshot,
  source: SubscriptionStatusSnapshot
) => {
  if (source.confirmed_by_id !== undefined) {
    snapshot.confirmed_by_id = source.confirmed_by_id
  }
  if (source.confirmed_by_email !== undefined) {
    snapshot.confirmed_by_email = source.confirmed_by_email
  }
  if (source.confirmed_by_name !== undefined) {
    snapshot.confirmed_by_name = source.confirmed_by_name
  }
  if (source.confirmed_at !== undefined) {
    snapshot.confirmed_at = source.confirmed_at
  }

  return snapshot
}

export const toSubscriptionStatusSnapshot = (
  source: SubscriptionStatusSnapshot
): SubscriptionStatusSnapshot => {
  const snapshot: SubscriptionStatusSnapshot = {
    payment_status: source.payment_status
  }

  if (source.status !== undefined) {
    snapshot.status = source.status
  }

  return addOptionalConfirmationFields(snapshot, source)
}

export const resolveAdminStatusTransition = (
  current: SubscriptionStatusSnapshot,
  action: AdminSubscriptionStatusAction,
  actor: AdminActor,
  now: number
): SubscriptionStatusSnapshot => {
  switch (action) {
    case 'pending_payment':
      return {
        payment_status: 'pending',
        status: 'pending_payment'
      }
    case 'payment_review':
      return {
        payment_status: 'pending',
        status: 'payment_review'
      }
    case 'confirm_payment': {
      const confirmed: SubscriptionStatusSnapshot = {
        payment_status: 'paid',
        status: 'confirmed',
        confirmed_by_id: actor.id,
        confirmed_at: now
      }

      if (actor.email !== undefined) {
        confirmed.confirmed_by_email = actor.email
      }
      if (actor.name !== undefined) {
        confirmed.confirmed_by_name = actor.name
      }

      return confirmed
    }
    case 'cancelled':
      if (
        current.payment_status === 'paid' ||
        current.status === 'confirmed'
      ) {
        throw new Error(
          'Confirmed subscriptions must be moved out of confirmed status before cancellation.'
        )
      }

      return {
        payment_status: current.payment_status,
        status: 'cancelled'
      }
  }
}

export const areSubscriptionStatusSnapshotsEqual = (
  left: SubscriptionStatusSnapshot,
  right: SubscriptionStatusSnapshot
) =>
  left.payment_status === right.payment_status &&
  left.status === right.status &&
  left.confirmed_by_id === right.confirmed_by_id &&
  left.confirmed_by_email === right.confirmed_by_email &&
  left.confirmed_by_name === right.confirmed_by_name &&
  left.confirmed_at === right.confirmed_at

