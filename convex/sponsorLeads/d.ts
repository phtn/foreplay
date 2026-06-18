import { v } from 'convex/values'

export const sponsorLeadSchema = v.object({
  tournament_id: v.string(),
  company_name: v.string(),
  authorized_signatory: v.optional(v.string()),
  contact_number: v.optional(v.string()),
  contact_email: v.optional(v.string()),
  preferred_tier: v.optional(v.string()),
  status: v.union(v.literal('new'), v.literal('contacted'), v.literal('won'), v.literal('lost')),
  notes: v.optional(v.string()),
  created_at: v.number(),
  updated_at: v.number()
})
