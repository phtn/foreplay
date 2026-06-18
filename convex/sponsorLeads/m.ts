import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const createSponsorLead = mutation({
  args: {
    tournament_id: v.string(),
    company_name: v.string(),
    authorized_signatory: v.optional(v.string()),
    contact_number: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    preferred_tier: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  returns: v.id('sponsorLeads'),
  handler: async (ctx, args) => {
    const companyName = args.company_name.trim()

    if (!companyName) {
      throw new ConvexError('Company name is required.')
    }

    const now = Date.now()
    const authorizedSignatory = trimOrUndefined(args.authorized_signatory)
    const contactNumber = trimOrUndefined(args.contact_number)
    const contactEmail = trimOrUndefined(args.contact_email)
    const preferredTier = trimOrUndefined(args.preferred_tier)
    const notes = trimOrUndefined(args.notes)

    return await ctx.db.insert('sponsorLeads', {
      tournament_id: args.tournament_id,
      company_name: companyName,
      status: 'new',
      created_at: now,
      updated_at: now,
      ...(authorizedSignatory ? { authorized_signatory: authorizedSignatory } : {}),
      ...(contactNumber ? { contact_number: contactNumber } : {}),
      ...(contactEmail ? { contact_email: contactEmail } : {}),
      ...(preferredTier ? { preferred_tier: preferredTier } : {}),
      ...(notes ? { notes } : {})
    })
  }
})
