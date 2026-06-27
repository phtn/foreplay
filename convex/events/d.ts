import { v } from 'convex/values'

export const eventSchema = v.object({
  title: v.string(),
  organizer: v.string(),
  organizer_id: v.string(),
  venue: v.string(),
  venue_coordinates: v.optional(
    v.object({
      latitude: v.number(),
      longitude: v.number()
    })
  ),
  event_date: v.string(),
  event_type: v.union(
    v.literal('tournament'),
    v.literal('championship'),
    v.literal('regular'),
    v.literal('sports'),
    v.literal('party'),
    v.literal('awards'),
    v.literal('contest')
  ),
  gate_open_at: v.number(),
  gate_open: v.number(),
  registered_slots: v.number(),
  slots_limit: v.optional(v.number()),
  bank_details_text: v.optional(v.string()),
  gcash_qr_url: v.optional(v.string()),
  published: v.optional(v.boolean()),
  active: v.optional(v.boolean()),
  description: v.optional(v.string()),
  commission_type: v.union(v.string(), v.string()),
  commission_value: v.optional(v.number()),
  ticket_price: v.number(),
  ticket_logo_url: v.optional(v.string()),
  ticket_primary_color: v.optional(v.string()),
  ticket_secondary_color: v.optional(v.string()),
  updated_at: v.optional(v.number())
})
