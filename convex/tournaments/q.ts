import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { query } from '../_generated/server'

export const listTournaments = query({
  args: {},
  handler: async ({ db }) => {
    return await db.query('tournaments').collect()
  }
})
export const getByTournamentId = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query('tournaments')
      .withIndex('by_tournament_id', (q) => q.eq('id', id))
      .unique()
  }
})

export const getForEditing = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const event = await ctx.db
      .query('tournaments')
      .withIndex('by_tournament_id', (q) => q.eq('id', id))
      .unique()

    if (!event) return null

    const resolveAssetUrl = async (value: string | undefined) => {
      if (!value) return null
      if (value.startsWith('https://') || value.startsWith('http://') || value.startsWith('/')) return value
      try {
        return await ctx.storage.getUrl(value as Id<'_storage'>)
      } catch {
        return null
      }
    }

    const [coverPhotoUrl, ticketLogoUrl] = await Promise.all([
      resolveAssetUrl(event.cover_photo_url),
      resolveAssetUrl(event.ticket_logo_url)
    ])

    return { event, coverPhotoUrl, ticketLogoUrl }
  }
})
