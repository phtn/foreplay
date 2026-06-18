import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listSponsorLeadsByTournament = query({
  args: { tournament_id: v.string() },
  handler: async (ctx, { tournament_id }) => {
    return await ctx.db
      .query('sponsorLeads')
      .withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournament_id))
      .collect()
  }
})
