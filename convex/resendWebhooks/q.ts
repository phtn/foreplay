import { paginationOptsValidator } from 'convex/server'
import { ConvexError, v } from 'convex/values'
import { query } from '../_generated/server'
import { trackedResendWebhookEventTypeValidator } from './d'

export const list = query({
  args: {
    eventType: v.optional(trackedResendWebhookEventTypeValidator),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity || identity.admin !== true) {
      throw new ConvexError('Unauthorized')
    }

    const eventType = args.eventType

    if (eventType) {
      return await ctx.db
        .query('resendWebhookEvents')
        .withIndex('by_eventType_and_receivedAt', (index) => index.eq('eventType', eventType))
        .order('desc')
        .paginate(args.paginationOpts)
    }

    return await ctx.db
      .query('resendWebhookEvents')
      .withIndex('by_receivedAt')
      .order('desc')
      .filter((filter) =>
        filter.or(
          filter.eq(filter.field('eventType'), 'email.sent'),
          filter.eq(filter.field('eventType'), 'email.delivered'),
          filter.eq(filter.field('eventType'), 'email.opened'),
          filter.eq(filter.field('eventType'), 'email.failed'),
          filter.eq(filter.field('eventType'), 'email.bounced')
        )
      )
      .paginate(args.paginationOpts)
  }
})
