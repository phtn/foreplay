import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listByTournamentId = query({
  args: {
    tournamentId: v.string()
  },
  handler: async (ctx, { tournamentId }) => {
    return await ctx.db
      .query('registrations')
      .withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournamentId))
      .collect()
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
