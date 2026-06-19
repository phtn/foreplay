import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const create = mutation({
  args: {
    userId: v.string(),
    tournamentId: v.string(),
    formId: v.string(),
    teamName: v.optional(v.string()),
    contactEmail: v.string(),
    contactPhone: v.string(),
    totalPlayers: v.number(),
    handicapIndex: v.optional(v.string()),
    division: v.optional(v.string())
  },
  returns: v.object({
    subscriptionId: v.id('subscriptions')
  }),
  handler: async (ctx, args) => {
    const contactEmail = args.contactEmail.trim().toLowerCase()
    const contactPhone = args.contactPhone.trim()
    const totalPlayers = Math.max(1, Math.min(4, Math.round(args.totalPlayers)))

    if (!contactEmail) {
      throw new ConvexError('Contact email is required.')
    }

    if (!contactPhone) {
      throw new ConvexError('Contact phone is required.')
    }

    const tournament = await ctx.db
      .query('tournaments')
      .withIndex('by_tournament_id', (q) => q.eq('id', args.tournamentId))
      .unique()

    const subscriptionId = await ctx.db.insert('subscriptions', {
      user_id: args.userId,
      tournament_id: args.tournamentId,
      tournament_name: tournament?.title ?? args.tournamentId,
      form_id: args.formId,
      team_name: trimOrUndefined(args.teamName),
      contact_email: contactEmail,
      contact_phone: contactPhone,
      total_players: String(totalPlayers),
      total_checked_in: '0',
      handicap_index: trimOrUndefined(args.handicapIndex),
      division: trimOrUndefined(args.division),
      payment_status: 'pending',
      txn_ref_no: args.formId,
      status: 'pending_payment'
    })

    return { subscriptionId }
  }
})
