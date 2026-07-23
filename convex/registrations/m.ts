import { ConvexError, v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { mutation } from '../_generated/server'
import {
  buildRegistrationDocument,
  MAX_REGISTRATIONS_PER_SUBSCRIPTION
} from './ticket'

const pairingGroup = v.union(v.literal('A'), v.literal('B'), v.literal('C'))

type GatePassPayload = {
  email?: unknown
  id?: unknown
  name?: unknown
  registrationId?: unknown
  ticketToken?: unknown
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

    if (
      subscription.payment_status !== 'paid' ||
      subscription.status !== 'confirmed'
    ) {
      throw new ConvexError(
        'Player tickets can only be created after payment is confirmed.'
      )
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
      .take(MAX_REGISTRATIONS_PER_SUBSCRIPTION + 1)

    const maxEntries = Number.parseInt(subscription.total_players, 10)

    if (!Number.isFinite(maxEntries) || maxEntries < 1) {
      throw new ConvexError('This subscription does not have a valid entry count.')
    }

    if (
      registrations.length >= maxEntries ||
      registrations.length >= MAX_REGISTRATIONS_PER_SUBSCRIPTION
    ) {
      throw new ConvexError('All available player forms are already in use.')
    }

    const registrationId = await ctx.db.insert(
      'registrations',
      buildRegistrationDocument({
        division: args.division,
        handicapIndex: args.handicapIndex,
        playerEmail: args.playerEmail,
        playerId: crypto.randomUUID(),
        playerName,
        playerPhone: args.playerPhone,
        shirtSize,
        subscription,
        ticketToken: crypto.randomUUID(),
        userId: args.userId
      })
    )

    return { registrationId }
  }
})

export const removeForSubscription = mutation({
  args: {
    registrationId: v.id('registrations'),
    subscriptionId: v.id('subscriptions'),
    ownerUserIds: v.array(v.string())
  },
  returns: v.object({
    registrationId: v.id('registrations')
  }),
  handler: async (ctx, args) => {
    const [registration, subscription] = await Promise.all([
      ctx.db.get(args.registrationId),
      ctx.db.get(args.subscriptionId)
    ])

    if (!subscription || !args.ownerUserIds.includes(subscription.user_id)) {
      throw new ConvexError('Subscription not found.')
    }

    if (!registration || registration.subscription_id !== args.subscriptionId) {
      throw new ConvexError('Player registration not found.')
    }

    if (registration.checked_in === true) {
      throw new ConvexError('Scanned registrations cannot be deleted.')
    }

    await ctx.db.delete(args.registrationId)

    return { registrationId: args.registrationId }
  }
})

export const updatePairingForAdmin = mutation({
  args: {
    registrationId: v.id('registrations'),
    startHole: v.optional(v.number()),
    pairingGroup: v.optional(pairingGroup)
  },
  returns: v.object({
    registrationId: v.id('registrations')
  }),
  handler: async (ctx, args) => {
    const registration = await ctx.db.get(args.registrationId)

    if (!registration) {
      throw new ConvexError('Player registration not found.')
    }

    if (args.startHole !== undefined && (!Number.isInteger(args.startHole) || args.startHole < 1 || args.startHole > 18)) {
      throw new ConvexError('Start hole must be between 1 and 18.')
    }

    await ctx.db.patch(args.registrationId, {
      start_hole: args.startHole,
      pairing_group: args.pairingGroup
    })

    return { registrationId: args.registrationId }
  }
})

function parseGatePassPayload(payload: string): GatePassPayload {
  try {
    const parsed = JSON.parse(payload) as unknown

    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as GatePassPayload
    }
  } catch {
    return { id: payload }
  }

  return { id: payload }
}

export const checkInByGatePassPayload = mutation({
  args: {
    payload: v.string()
  },
  returns: v.object({
    alreadyCheckedIn: v.boolean(),
    checkedIn: v.boolean(),
    checkedInAt: v.number(),
    playerEmail: v.optional(v.string()),
    playerName: v.string(),
    registrationId: v.id('registrations'),
    tournamentId: v.string()
  }),
  handler: async (ctx, args) => {
    const payload = parseGatePassPayload(args.payload)
    const ticketToken = typeof payload.ticketToken === 'string' ? payload.ticketToken.trim() : ''
    const registrationId =
      typeof payload.registrationId === 'string'
        ? payload.registrationId.trim()
        : typeof payload.id === 'string'
          ? payload.id.trim()
          : ''
    const registration = ticketToken
      ? await ctx.db
          .query('registrations')
          .withIndex('by_ticketToken', (q) => q.eq('ticket_token', ticketToken))
          .first()
      : registrationId
        ? await ctx.db.get(registrationId as Id<'registrations'>)
        : null

    if (!registration) {
      throw new ConvexError('Gate pass not found.')
    }

    const subscription = registration.subscription_id
      ? await ctx.db.get(registration.subscription_id)
      : null
    const ticketIsActive = registration.subscription_id
      ? subscription?.payment_status === 'paid' &&
        subscription.status === 'confirmed'
      : registration.payment_status === 'paid'

    if (!ticketIsActive) {
      throw new ConvexError(
        'This ticket is not active because payment is not confirmed.'
      )
    }

    const alreadyCheckedIn = registration.checked_in === true
    const checkedInAt = registration.checked_in_at ?? Date.now()

    if (!alreadyCheckedIn) {
      await ctx.db.patch(registration._id, {
        checked_in: true,
        checked_in_at: checkedInAt
      })

      if (registration.subscription_id && subscription) {
        const currentCheckedIn = Number.parseInt(subscription?.total_checked_in ?? '0', 10)
        const nextCheckedIn = Number.isFinite(currentCheckedIn) ? currentCheckedIn + 1 : 1

        await ctx.db.patch(registration.subscription_id, {
          total_checked_in: String(nextCheckedIn)
        })
      }
    }

    return {
      alreadyCheckedIn,
      checkedIn: true,
      checkedInAt,
      playerEmail: registration.player_email,
      playerName: registration.player_name,
      registrationId: registration._id,
      tournamentId: registration.tournament_id
    }
  }
})
