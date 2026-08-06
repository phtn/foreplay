import { paginationOptsValidator } from 'convex/server'
import { countEmailSentEventsByTarget } from '@/lib/resend/webhooks/sent-counts'
import { ConvexError, v } from 'convex/values'
import { query } from '../_generated/server'
import { trackedResendWebhookEventTypeValidator } from './d'

const MAX_SENT_COUNT_EMAILS = 500

export const getEmailSentCounts = query({
  args: { emails: v.array(v.string()) },
  handler: async (ctx, { emails }) => {
    if (emails.length > MAX_SENT_COUNT_EMAILS) {
      throw new ConvexError('Too many email addresses were requested.')
    }

    const sentEvents = await ctx.db
      .query('resendWebhookEvents')
      .withIndex('by_eventType_and_receivedAt', (index) => index.eq('eventType', 'email.sent'))
      .collect()

    return countEmailSentEventsByTarget(sentEvents, emails)
  }
})

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
