import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listBySubscriptionIdForUser = query({
  args: {
    subscriptionId: v.id('subscriptions'),
    userId: v.string()
  },
  handler: async (ctx, { subscriptionId, userId }) => {
    const subscription = await ctx.db.get(subscriptionId)

    if (!subscription || subscription.user_id !== userId) {
      return []
    }

    return await ctx.db
      .query('registrations')
      .withIndex('by_subscriptionId', (q) => q.eq('subscription_id', subscriptionId))
      .collect()
  }
})
