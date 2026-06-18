import { v } from 'convex/values'

export const tournamentSchema = v.object({
  title: v.string(),
  venue: v.string(),
  event_date: v.string(),
  gate_open_at: v.number(),
  gate_open: v.number(),
  registration_fee: v.number(),
  registered_slots: v.number(),
  slots_limit: v.optional(v.number()),
  divisions: v.optional(v.array(v.string())),
  bank_details_text: v.optional(v.string()),
  gcash_qr_url: v.optional(v.string()),
  published: v.optional(v.boolean()),
  description: v.optional(v.string()),
  commission_type: v.union(v.string(), v.string()),
  commission_value: v.optional(v.number()),
  ticket_logo_url: v.optional(v.string()),
  ticket_primary_color: v.optional(v.string()),
  ticket_secondary_color: v.optional(v.string()),
  overview_facts: v.optional(
    v.array(
      v.object({
        label: v.string(),
        value: v.string()
      })
    )
  ),
  partner_pitch: v.optional(v.string()),
  partner_reasons: v.optional(
    v.array(
      v.object({
        title: v.string(),
        description: v.string()
      })
    )
  ),
  sponsorship_tiers: v.optional(
    v.array(
      v.object({
        name: v.string(),
        investment_label: v.string(),
        playing_access: v.string(),
        access_note: v.optional(v.string()),
        benefits: v.array(v.string())
      })
    )
  ),
  sponsor_contact_phone: v.optional(v.string()),
  sponsor_contact_email: v.optional(v.string())
})
