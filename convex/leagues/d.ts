import { v } from 'convex/values'

export const leagueSchema = v.object({
  accountId: v.id('accounts'),
  userId: v.id('users'),
  amount: v.number(),
  title: v.string(),
  level: v.number(),
  isStaked: v.boolean(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
})

export type League = typeof leagueSchema.type
