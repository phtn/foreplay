type SubscriptionEntryState = {
  payment_status?: string
  receipt_image_url?: string
  status?: string
}

export function isSubscriptionEntryLocked(subscription: SubscriptionEntryState | null | undefined) {
  if (!subscription) {
    return false
  }

  return Boolean(
    subscription.receipt_image_url ||
      subscription.payment_status === 'paid' ||
      subscription.status === 'payment_review' ||
      subscription.status === 'confirmed' ||
      subscription.status === 'cancelled'
  )
}
