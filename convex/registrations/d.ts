import { v } from 'convex/values'

export const registrationSchema = v.object({
  user_id: v.string(),
  tournament_id: v.string(),
  subscription_id: v.optional(v.id('subscriptions')),
  player_id: v.string(),
  player_name: v.string(),
  player_email: v.optional(v.string()),
  player_phone: v.optional(v.string()),
  affiliate_id: v.optional(v.string()),
  handicap_index: v.optional(v.string()),
  division: v.optional(v.string()),
  shirt_size: v.union(v.string(), v.string(), v.string(), v.string(), v.string(), v.string(), v.string()),
  payment_status: v.union(v.string(), v.string(), v.string(), v.string()),
  receipt_image_url: v.optional(v.string()),
  txn_ref_no: v.optional(v.string()),
  checked_in: v.optional(v.boolean()),
  checked_in_at: v.optional(v.number()),
  start_hole: v.optional(v.number()),
  pairing_group: v.optional(v.union(v.literal('A'), v.literal('B'), v.literal('C'))),
  ticket_token: v.optional(v.string()),
  affiliate_payout_amount: v.optional(v.number())
})
