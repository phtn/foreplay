import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listMessagingConfigs = query({
  args: {},
  handler: async ({ db }) => {
    return await db.query('messagingConfigs').collect()
  }
})

export const getMessagingConfigsCount = query({
  args: {},
  handler: async ({ db }): Promise<number> => {
    let count = 0

    for await (const _setting of db.query('messagingConfigs')) {
      count += 1
    }

    return count
  }
})

export const getEmailSetting = query({
  args: {
    id: v.id('messagingConfigs')
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  }
})

export const getmessagingConfigsByIntent = query({
  args: {
    intent: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messagingConfigs')
      .withIndex('by_intent', (q) => q.eq('intent', args.intent))
      .collect()
  }
})

export const getMessagingConfigByIntent = query({
  args: {
    intent: v.string()
  },
  handler: async (ctx, { intent }) => {
    return await ctx.db
      .query('messagingConfigs')
      .withIndex('by_intent', (q) => q.eq('intent', intent))
      .first()
  }
})
