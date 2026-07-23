import { v } from 'convex/values'
import { query } from '../_generated/server'

export const getCheckInStatus = query({
  args: {
    registrationId: v.id('registrations')
  },
  returns: v.union(
    v.null(),
    v.object({
      checkedIn: v.boolean(),
      checkedInAt: v.optional(v.number())
    })
  ),
  handler: async (ctx, { registrationId }) => {
    const registration = await ctx.db.get(registrationId)

    if (!registration) {
      return null
    }

    return {
      checkedIn: registration.checked_in === true,
      checkedInAt: registration.checked_in_at
    }
  }
})

export const listByTournamentId = query({
  args: {
    tournamentId: v.string()
  },
  handler: async (ctx, { tournamentId }) => {
    return await ctx.db
      .query('registrations')
      .withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournamentId))
      .take(500)
  }
})

export const listBySubscriptionIdForUser = query({
  args: {
    subscriptionId: v.id('subscriptions'),
    userIds: v.array(v.string())
  },
  handler: async (ctx, { subscriptionId, userIds }) => {
    const subscription = await ctx.db.get(subscriptionId)

    if (!subscription || !userIds.includes(subscription.user_id)) {
      return []
    }

    return await ctx.db
      .query('registrations')
      .withIndex('by_subscriptionId', (q) => q.eq('subscription_id', subscriptionId))
      .collect()
  }
})
