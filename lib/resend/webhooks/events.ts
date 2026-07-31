export const trackedResendWebhookEventTypes = [
  'email.sent',
  'email.delivered',
  'email.opened',
  'email.failed',
  'email.bounced'
] as const

export type TrackedResendWebhookEventType = (typeof trackedResendWebhookEventTypes)[number]

const trackedEventTypeSet = new Set<string>(trackedResendWebhookEventTypes)

export function isTrackedResendWebhookEventType(value: string): value is TrackedResendWebhookEventType {
  return trackedEventTypeSet.has(value)
}
