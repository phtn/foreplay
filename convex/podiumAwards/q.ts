import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listByTournamentId = query({
  args: {
    tournamentId: v.string()
  },
  handler: async (ctx, { tournamentId }) => {
    return await ctx.db
      .query('podiumAwards')
      .withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournamentId))
      .collect()
  }
})
