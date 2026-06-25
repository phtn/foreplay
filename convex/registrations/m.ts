import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const createForSubscription = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    userId: v.string(),
    ownerUserIds: v.array(v.string()),
    playerName: v.string(),
    playerEmail: v.optional(v.string()),
    playerPhone: v.optional(v.string()),
    handicapIndex: v.optional(v.string()),
    division: v.optional(v.string()),
    shirtSize: v.string()
  },
  returns: v.object({
    registrationId: v.id('registrations')
  }),
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription || !args.ownerUserIds.includes(subscription.user_id)) {
      throw new ConvexError('Subscription not found.')
    }

    const playerName = args.playerName.trim()
    const shirtSize = args.shirtSize.trim()

    if (!playerName) {
      throw new ConvexError('Player name is required.')
    }

    if (!shirtSize) {
      throw new ConvexError('Shirt size is required.')
    }

    const registrations = await ctx.db
      .query('registrations')
      .withIndex('by_subscriptionId', (q) => q.eq('subscription_id', args.subscriptionId))
      .collect()

    const maxEntries = Number.parseInt(subscription.total_players, 10)

    if (!Number.isFinite(maxEntries) || maxEntries < 1) {
      throw new ConvexError('This subscription does not have a valid entry count.')
    }

    if (registrations.length >= maxEntries) {
      throw new ConvexError('All available player forms are already in use.')
    }

    const registrationId = await ctx.db.insert('registrations', {
      user_id: args.userId,
      tournament_id: subscription.tournament_id,
      subscription_id: args.subscriptionId,
      player_id: crypto.randomUUID(),
      player_name: playerName,
      player_email: trimOrUndefined(args.playerEmail)?.toLowerCase(),
      player_phone: trimOrUndefined(args.playerPhone),
      handicap_index: trimOrUndefined(args.handicapIndex),
      division: trimOrUndefined(args.division) ?? subscription.division,
      shirt_size: shirtSize,
      payment_status: subscription.payment_status,
      receipt_image_url: subscription.receipt_image_url,
      txn_ref_no: subscription.txn_ref_no,
      checked_in: false
    })

    return { registrationId }
  }
})
