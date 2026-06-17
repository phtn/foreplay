import { v } from 'convex/values'

const paymentStatus = v.union(v.literal('pending'), v.literal('paid'), v.literal('failed'), v.literal('refunded'))

export const subscriptionSchema = v.object({
  user_id: v.string(),
  tournament_id: v.string(),
  tournament_name: v.string(),
  total_players: v.string(),
  total_checked_in: v.string(),
  handicap_index: v.optional(v.string()),
  division: v.optional(v.string()),
  payment_status: paymentStatus,
  receipt_image_url: v.optional(v.string()),
  txn_ref_no: v.optional(v.string()),
  payment_qrcode: v.optional(v.string()),
  status: v.optional(v.string())
})

export type Subscription = typeof subscriptionSchema
export type PaymentStatus = typeof paymentStatus
