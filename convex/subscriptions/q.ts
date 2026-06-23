import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_user_id', (q) => q.eq('user_id', userId))
      .order('desc')
      .collect()
  }
})

export const getByIdForUser = query({
  args: {
    subscriptionId: v.id('subscriptions'),
    userId: v.string()
  },
  handler: async (ctx, { subscriptionId, userId }) => {
    const subscription = await ctx.db.get(subscriptionId)

    if (!subscription || subscription.user_id !== userId) {
      return null
    }

    return subscription
  }
})
