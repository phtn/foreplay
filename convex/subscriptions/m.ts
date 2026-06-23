import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const create = mutation({
  args: {
    userId: v.string(),
    tournamentId: v.string(),
    formId: v.string(),
    teamName: v.optional(v.string()),
    contactEmail: v.string(),
    contactPhone: v.string(),
    totalPlayers: v.number(),
    paymentAmount: v.number(),
    handicapIndex: v.optional(v.string()),
    division: v.optional(v.string())
  },
  returns: v.object({
    subscriptionId: v.id('subscriptions')
  }),
  handler: async (ctx, args) => {
    const contactEmail = args.contactEmail.trim().toLowerCase()
    const contactPhone = args.contactPhone.trim()
    const totalPlayers = Math.max(1, Math.min(4, Math.round(args.totalPlayers)))
    const paymentAmount = Math.max(0, Math.round(args.paymentAmount))

    if (!contactEmail) {
      throw new ConvexError('Contact email is required.')
    }

    if (!contactPhone) {
      throw new ConvexError('Contact phone is required.')
    }

    if (!Number.isFinite(paymentAmount)) {
      throw new ConvexError('Payment amount is invalid.')
    }

    const tournament = await ctx.db
      .query('tournaments')
      .withIndex('by_tournament_id', (q) => q.eq('id', args.tournamentId))
      .unique()

    const subscriptionId = await ctx.db.insert('subscriptions', {
      user_id: args.userId,
      tournament_id: args.tournamentId,
      tournament_name: tournament?.title ?? args.tournamentId,
      form_id: args.formId,
      team_name: trimOrUndefined(args.teamName),
      contact_email: contactEmail,
      contact_phone: contactPhone,
      total_players: String(totalPlayers),
      total_checked_in: '0',
      handicap_index: trimOrUndefined(args.handicapIndex),
      division: trimOrUndefined(args.division),
      payment_status: 'pending',
      payment_amount: paymentAmount,
      txn_ref_no: args.formId,
      status: 'pending_payment'
    })

    return { subscriptionId }
  }
})

export const generateReceiptUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  }
})

export const updateReceipt = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    formId: v.string(),
    storageId: v.id('_storage')
  },
  returns: v.object({
    subscriptionId: v.id('subscriptions'),
    receiptImageUrl: v.string()
  }),
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription) {
      throw new ConvexError('Subscription not found.')
    }

    if (subscription.form_id !== args.formId) {
      throw new ConvexError('Receipt does not match this entry request.')
    }

    await ctx.db.patch(args.subscriptionId, {
      receipt_image_url: args.storageId,
      status: 'payment_review'
    })

    return {
      subscriptionId: args.subscriptionId,
      receiptImageUrl: args.storageId
    }
  }
})

export const cancel = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    userId: v.string()
  },
  returns: v.object({
    subscriptionId: v.id('subscriptions'),
    status: v.string()
  }),
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription || subscription.user_id !== args.userId) {
      throw new ConvexError('Subscription not found.')
    }

    if (subscription.status === 'confirmed' || subscription.payment_status === 'paid') {
      throw new ConvexError('Confirmed subscriptions cannot be cancelled here.')
    }

    if (subscription.status !== 'cancelled') {
      await ctx.db.patch(args.subscriptionId, {
        status: 'cancelled'
      })
    }

    return {
      subscriptionId: args.subscriptionId,
      status: 'cancelled'
    }
  }
})
