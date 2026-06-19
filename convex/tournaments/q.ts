import { v } from 'convex/values'
import { query } from '../_generated/server'

export const getByTournamentId = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query('tournaments')
      .withIndex('by_tournament_id', (q) => q.eq('id', id))
      .unique()
  }
})
