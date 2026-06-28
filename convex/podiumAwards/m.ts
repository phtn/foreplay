import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'

export const assign = mutation({
  args: {
    tournamentId: v.string(),
    awardKey: v.string(),
    awardTitle: v.string(),
    awardEyebrow: v.string(),
    position: v.number(),
    registrationId: v.optional(v.id('registrations'))
  },
  returns: v.id('podiumAwards'),
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.position) || args.position < 1) {
      throw new ConvexError('Award position is invalid.')
    }

    if (args.registrationId) {
      const registration = await ctx.db.get(args.registrationId)

      if (!registration || registration.tournament_id !== args.tournamentId) {
        throw new ConvexError('Selected player is not registered for this event.')
      }
    }

    const existingAward = await ctx.db
      .query('podiumAwards')
      .withIndex('by_tournamentId_awardKey_position', (q) =>
        q.eq('tournament_id', args.tournamentId).eq('award_key', args.awardKey).eq('position', args.position)
      )
      .unique()
    const payload = {
      tournament_id: args.tournamentId,
      award_key: args.awardKey,
      award_title: args.awardTitle,
      award_eyebrow: args.awardEyebrow,
      position: args.position,
      registration_id: args.registrationId,
      updated_at: Date.now()
    }

    if (existingAward) {
      await ctx.db.patch(existingAward._id, payload)
      return existingAward._id
    }

    return await ctx.db.insert('podiumAwards', payload)
  }
})
