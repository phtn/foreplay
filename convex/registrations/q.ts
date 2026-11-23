import { v } from 'convex/values'
import { query } from '../_generated/server'

const PAIRINGS_READ_LIMIT = 500

export const getCheckInStatus = query({
  args: {
    registrationId: v.id('registrations')
  },
  returns: v.union(
    v.null(),
    v.object({
      checkedIn: v.boolean(),
      checkedInAt: v.optional(v.number())
    })
  ),
  handler: async (ctx, { registrationId }) => {
    const registration = await ctx.db.get(registrationId)

    if (!registration) {
      return null
    }

    return {
      checkedIn: registration.checked_in === true,
      checkedInAt: registration.checked_in_at
    }
  }
})

export const listByTournamentId = query({
  args: {
    tournamentId: v.string()
  },
  handler: async (ctx, { tournamentId }) => {
    return await ctx.db
      .query('registrations')
      .withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournamentId))
      .take(500)
  }
})

export const listForPairings = query({
  args: { tournamentId: v.string() },
  handler: async ({ db }, { tournamentId }) => {
    const [registrations, subscriptions] = await Promise.all([
      db
        .query('registrations')
        .withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournamentId))
        .filter((q) => q.neq(q.field('entry_type'), 'non_playing'))
        .take(PAIRINGS_READ_LIMIT),
      db
        .query('subscriptions')
        .withIndex('by_tournamentId', (q) => q.eq('tournament_id', tournamentId))
        .take(PAIRINGS_READ_LIMIT)
    ])
    const represented = new Set(registrations.map(({ subscription_id }) => subscription_id))
    const pending = subscriptions.filter((subscription) =>
      subscription.payment_status === 'pending' &&
      subscription.status !== 'cancelled' &&
      subscription.entry_type !== 'non_playing' &&
      !represented.has(subscription._id)
    )
    // At the read limit, some subscriptions may already have a player outside the result.
    const unrepresented =
      registrations.length < PAIRINGS_READ_LIMIT
        ? pending
        : (
            await Promise.all(
              pending.map(async (subscription) => {
                const registration = await db
                  .query('registrations')
                  .withIndex('by_subscriptionId', (q) => q.eq('subscription_id', subscription._id))
                  .first()
                return registration ? null : subscription
              })
            )
          ).filter((subscription) => subscription !== null)

    return [
      ...registrations.map((registration) => ({
        _id: registration._id,
        _creationTime: registration._creationTime,
        player_name: registration.player_name,
        player_id: registration.player_id,
        shirt_size: registration.shirt_size,
        checked_in: registration.checked_in,
        start_hole: registration.start_hole,
        pairing_group: registration.pairing_group
      })),
      ...unrepresented.map((subscription) => ({
        _id: subscription._id,
        _creationTime: subscription._creationTime,
        player_name: subscription.team_name?.trim() || 'Player',
        player_id: subscription._id,
        shirt_size: undefined,
        checked_in: false,
        start_hole: subscription.pending_pairing?.start_hole,
        pairing_group: subscription.pending_pairing?.pairing_group
      }))
    ]
  }
})

export const listBySubscriptionIdForUser = query({
  args: {
    subscriptionId: v.id('subscriptions'),
    userIds: v.array(v.string())
  },
  handler: async (ctx, { subscriptionId, userIds }) => {
    const subscription = await ctx.db.get(subscriptionId)

    if (!subscription || !userIds.includes(subscription.user_id)) {
      return []
    }

    return await ctx.db
      .query('registrations')
      .withIndex('by_subscriptionId', (q) => q.eq('subscription_id', subscriptionId))
      .collect()
  }
})
