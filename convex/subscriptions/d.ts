import { v } from 'convex/values'

export const paymentStatus = v.union(
  v.literal('pending'),
  v.literal('paid'),
  v.literal('failed'),
  v.literal('refunded')
)

export const adminSubscriptionStatusAction = v.union(
  v.literal('pending_payment'),
  v.literal('payment_review'),
  v.literal('confirm_payment'),
  v.literal('cancelled')
)

export const subscriptionStatusSnapshotSchema = v.object({
  payment_status: paymentStatus,
  status: v.optional(v.string()),
  confirmed_by_id: v.optional(v.string()),
  confirmed_by_email: v.optional(v.string()),
  confirmed_by_name: v.optional(v.string()),
  confirmed_at: v.optional(v.number())
})

export const subscriptionStatusChangeSchema = v.object({
  subscription_id: v.id('subscriptions'),
  action: adminSubscriptionStatusAction,
  previous: subscriptionStatusSnapshotSchema,
  next: subscriptionStatusSnapshotSchema,
  previous_change_id: v.optional(v.id('subscriptionStatusChanges')),
  actor_id: v.string(),
  actor_email: v.optional(v.string()),
  actor_name: v.optional(v.string()),
  undone_at: v.optional(v.number()),
  undone_by_id: v.optional(v.string()),
  undone_by_email: v.optional(v.string()),
  undone_by_name: v.optional(v.string())
})

export const subscriptionSchema = v.object({
  user_id: v.string(),
  tournament_id: v.string(),
  tournament_name: v.string(),
  form_id: v.optional(v.string()),
  team_name: v.optional(v.string()),
  contact_email: v.optional(v.string()),
  contact_phone: v.optional(v.string()),
  total_players: v.string(),
  total_checked_in: v.string(),
  handicap_index: v.optional(v.string()),
  division: v.optional(v.string()),
  payment_status: paymentStatus,
  payment_amount: v.optional(v.number()),
  receipt_image_url: v.optional(v.string()),
  txn_ref_no: v.optional(v.string()),
  payment_qrcode: v.optional(v.string()),
  admin_remarks: v.optional(v.string()),
  confirmed_by_id: v.optional(v.string()),
  confirmed_by_email: v.optional(v.string()),
  confirmed_by_name: v.optional(v.string()),
  confirmed_at: v.optional(v.number()),
  status: v.optional(v.string()),
  admin_status_change_id: v.optional(
    v.id('subscriptionStatusChanges')
  )
})

export type Subscription = typeof subscriptionSchema
export type PaymentStatus = typeof paymentStatus
