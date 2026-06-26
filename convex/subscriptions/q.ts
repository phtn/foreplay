import { v } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import { query } from '../_generated/server'

const dedupeSubscriptions = (subscriptions: Doc<'subscriptions'>[]) => {
  return Array.from(new Map(subscriptions.map((subscription) => [subscription._id, subscription])).values()).sort(
    (left, right) => right._creationTime - left._creationTime
  )
}

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

export const listByUserIds = query({
  args: { userIds: v.array(v.string()) },
  handler: async (ctx, { userIds }) => {
    const subscriptions = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query('subscriptions')
          .withIndex('by_user_id', (q) => q.eq('user_id', userId))
          .collect()
      )
    )

    return dedupeSubscriptions(subscriptions.flat())
  }
})

export const listByTournamentId = query({
  args: { tournamentId: v.string() },
  handler: async (ctx, { tournamentId }) => {
    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournamentId))
      .order('desc')
      .collect()

    return await Promise.all(
      subscriptions.map(async (subscription) => ({
        ...subscription,
        receiptImageUrl: subscription.receipt_image_url
          ? await ctx.storage.getUrl(subscription.receipt_image_url as Id<'_storage'>)
          : null
      }))
    )
  }
})

export const listByTournamentIdForUserIds = query({
  args: {
    tournamentId: v.string(),
    userIds: v.array(v.string())
  },
  handler: async (ctx, { tournamentId, userIds }) => {
    const subscriptions = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query('subscriptions')
          .withIndex('by_userId_tournamentId', (q) => q.eq('user_id', userId).eq('tournament_id', tournamentId))
          .collect()
      )
    )

    return dedupeSubscriptions(subscriptions.flat())
  }
})

export const getByTournamentIdAndFormId = query({
  args: {
    tournamentId: v.string(),
    formId: v.string(),
    userIds: v.array(v.string())
  },
  handler: async (ctx, { tournamentId, formId, userIds }) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_tournamentId_formId', (q) => q.eq('tournament_id', tournamentId).eq('form_id', formId))
      .first()

    if (!subscription) {
      return null
    }

    if (!userIds.includes(subscription.user_id)) {
      return null
    }

    return subscription
  }
})

export const getByIdForUser = query({
  args: {
    subscriptionId: v.id('subscriptions'),
    userIds: v.array(v.string())
  },
  handler: async (ctx, { subscriptionId, userIds }) => {
    const subscription = await ctx.db.get(subscriptionId)

    if (!subscription || !userIds.includes(subscription.user_id)) {
      return null
    }

    return subscription
  }
})
