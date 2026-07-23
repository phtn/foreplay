export const editableSubscriptionStatuses = [
  'pending_payment',
  'payment_review',
  'cancelled'
] as const

export type EditableSubscriptionStatus =
  (typeof editableSubscriptionStatuses)[number]

export interface SubscriptionStatusActionInput {
  eventId: string
  subscriptionId: string
}

