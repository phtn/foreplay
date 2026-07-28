import { ConvexError, v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { mutation, type MutationCtx } from '../_generated/server'
import { MAX_REGISTRATIONS_PER_SUBSCRIPTION, reconcileSubscriptionTickets } from '../registrations/ticket'
import {
  areSubscriptionStatusSnapshotsEqual,
  resolveAdminStatusTransition,
  toSubscriptionStatusSnapshot,
  type AdminSubscriptionStatusAction,
  type SubscriptionStatusSnapshot
} from './adminStatus'
import { adminSubscriptionStatusAction, paymentStatus } from './d'
import { isSubscriptionEntryLocked } from './policy'

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const trimRequiredAdminDetail = (value: string, label: string, maxLength: number) => {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new ConvexError(`${label} is required.`)
  }

  if (trimmed.length > maxLength) {
    throw new ConvexError(`${label} must be ${maxLength} characters or fewer.`)
  }

  return trimmed
}

const trimOptionalAdminDetail = (value: string, label: string, maxLength: number) => {
  const trimmed = value.trim()

  if (trimmed.length > maxLength) {
    throw new ConvexError(`${label} must be ${maxLength} characters or fewer.`)
  }

  return trimmed || undefined
}

const requireAdminIdentity = async (ctx: MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity || identity.admin !== true) {
    throw new ConvexError('Unauthorized')
  }
}

const adminStatusChangeResult = v.object({
  subscriptionId: v.id('subscriptions'),
  payment_status: paymentStatus,
  status: v.optional(v.string()),
  canUndo: v.boolean()
})

interface AdminStatusActor {
  id: string
  email?: string
  name?: string
}

interface ApplyAdminStatusArgs {
  subscriptionId: Id<'subscriptions'>
  tournamentId: string
  action: AdminSubscriptionStatusAction
  actor: AdminStatusActor
}

const toStatusPatch = (
  snapshot: SubscriptionStatusSnapshot,
  changeId: Id<'subscriptionStatusChanges'> | undefined
) => ({
  payment_status: snapshot.payment_status,
  status: snapshot.status,
  confirmed_by_id: snapshot.confirmed_by_id,
  confirmed_by_email: snapshot.confirmed_by_email,
  confirmed_by_name: snapshot.confirmed_by_name,
  confirmed_at: snapshot.confirmed_at,
  admin_status_change_id: changeId,
  updatedAt: Date.now()
})

const getAdminStatusResult = (
  subscriptionId: Id<'subscriptions'>,
  snapshot: SubscriptionStatusSnapshot,
  canUndo: boolean
) => ({
  subscriptionId,
  payment_status: snapshot.payment_status,
  status: snapshot.status,
  canUndo
})

const applyAdminStatus = async (
  ctx: MutationCtx,
  { subscriptionId, tournamentId, action, actor }: ApplyAdminStatusArgs
) => {
  const subscription = await ctx.db.get(subscriptionId)

  if (!subscription || subscription.tournament_id !== tournamentId) {
    throw new ConvexError('Subscription not found.')
  }

  const previous = toSubscriptionStatusSnapshot(subscription)

  if (action === 'confirm_payment' && previous.payment_status === 'paid' && previous.status === 'confirmed') {
    await reconcileSubscriptionTickets(ctx, subscription, 'paid', true)

    return getAdminStatusResult(subscriptionId, previous, Boolean(subscription.admin_status_change_id))
  }

  let next: SubscriptionStatusSnapshot
  try {
    next = resolveAdminStatusTransition(previous, action, actor, Date.now())
  } catch (error) {
    throw new ConvexError(error instanceof Error ? error.message : 'The requested status transition is invalid.')
  }

  if (areSubscriptionStatusSnapshotsEqual(previous, next)) {
    return getAdminStatusResult(subscriptionId, previous, Boolean(subscription.admin_status_change_id))
  }

  await reconcileSubscriptionTickets(ctx, subscription, next.payment_status, action === 'confirm_payment')

  const actorEmail = trimOrUndefined(actor.email)
  const actorName = trimOrUndefined(actor.name)
  const changeId = await ctx.db.insert('subscriptionStatusChanges', {
    subscription_id: subscriptionId,
    action,
    previous,
    next,
    ...(subscription.admin_status_change_id
      ? {
          previous_change_id: subscription.admin_status_change_id
        }
      : {}),
    actor_id: actor.id,
    ...(actorEmail ? { actor_email: actorEmail } : {}),
    ...(actorName ? { actor_name: actorName } : {})
  })

  await ctx.db.patch(subscriptionId, toStatusPatch(next, changeId))

  return getAdminStatusResult(subscriptionId, next, true)
}

export const create = mutation({
  args: {
    userId: v.string(),
    ownerUserIds: v.array(v.string()),
    tournamentId: v.string(),
    formId: v.string(),
    teamName: v.optional(v.string()),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
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
    const contactPhone = trimOrUndefined(args.contactPhone)
    const totalPlayers = Math.max(1, Math.min(20, Math.round(args.totalPlayers)))
    const paymentAmount = Math.max(0, Math.round(args.paymentAmount))

    if (!contactEmail) {
      throw new ConvexError('Contact email is required.')
    }

    if (!Number.isFinite(paymentAmount)) {
      throw new ConvexError('Payment amount is invalid.')
    }

    const tournament = await ctx.db
      .query('tournaments')
      .withIndex('by_tournament_id', (q) => q.eq('id', args.tournamentId))
      .unique()
    const existingSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_tournamentId_formId', (q) => q.eq('tournament_id', args.tournamentId).eq('form_id', args.formId))
      .first()

    if (existingSubscription) {
      if (!args.ownerUserIds.includes(existingSubscription.user_id)) {
        throw new ConvexError('Entry reference already exists.')
      }

      if (isSubscriptionEntryLocked(existingSubscription)) {
        throw new ConvexError('Payment proof has already been submitted. This entry can no longer be edited.')
      }

      await ctx.db.patch(existingSubscription._id, {
        team_name: trimOrUndefined(args.teamName),
        contact_email: contactEmail,
        contact_phone: contactPhone,
        total_players: String(totalPlayers),
        handicap_index: trimOrUndefined(args.handicapIndex),
        division: trimOrUndefined(args.division),
        payment_amount: paymentAmount,
        txn_ref_no: args.formId,
        status: 'pending_payment',
        updatedAt: Date.now()
      })

      return { subscriptionId: existingSubscription._id }
    }

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
      status: 'pending_payment',
      updatedAt: Date.now()
    })

    return { subscriptionId }
  }
})

export const updateRegistrationDetailsForAdmin = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    tournamentId: v.string(),
    teamName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    handicapIndex: v.string(),
    division: v.string(),
    registrations: v.array(
      v.object({
        registrationId: v.id('registrations'),
        playerName: v.string(),
        playerEmail: v.string(),
        playerPhone: v.string(),
        handicapIndex: v.string(),
        division: v.string(),
        shirtSize: v.string()
      })
    )
  },
  returns: v.object({
    subscriptionId: v.id('subscriptions'),
    updatedRegistrationCount: v.number()
  }),
  handler: async (ctx, args) => {
    await requireAdminIdentity(ctx)

    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription || subscription.tournament_id !== args.tournamentId) {
      throw new ConvexError('Subscription not found.')
    }

    if (args.registrations.length > MAX_REGISTRATIONS_PER_SUBSCRIPTION) {
      throw new ConvexError('This subscription has too many player registrations.')
    }

    const existingRegistrations = await ctx.db
      .query('registrations')
      .withIndex('by_subscriptionId', (q) => q.eq('subscription_id', args.subscriptionId))
      .take(MAX_REGISTRATIONS_PER_SUBSCRIPTION + 1)

    if (existingRegistrations.length !== args.registrations.length) {
      throw new ConvexError('The player list changed. Refresh the page before saving again.')
    }

    const existingById = new Map(
      existingRegistrations.map((registration) => [registration._id, registration])
    )
    const submittedIds = new Set<Id<'registrations'>>()
    const preparedRegistrations = args.registrations.map((registration, index) => {
      const existing = existingById.get(registration.registrationId)

      if (
        submittedIds.has(registration.registrationId) ||
        !existing ||
        existing.subscription_id !== args.subscriptionId ||
        existing.tournament_id !== args.tournamentId
      ) {
        throw new ConvexError('One or more player registrations do not belong to this entry.')
      }

      submittedIds.add(registration.registrationId)

      return {
        registrationId: registration.registrationId,
        playerName: trimRequiredAdminDetail(registration.playerName, `Player ${index + 1} name`, 120),
        playerEmail: trimOptionalAdminDetail(registration.playerEmail, `Player ${index + 1} email`, 320)?.toLowerCase(),
        playerPhone: trimOptionalAdminDetail(registration.playerPhone, `Player ${index + 1} phone`, 64),
        handicapIndex: trimOptionalAdminDetail(registration.handicapIndex, `Player ${index + 1} handicap`, 64),
        division: trimOptionalAdminDetail(registration.division, `Player ${index + 1} division`, 120),
        shirtSize: trimRequiredAdminDetail(registration.shirtSize, `Player ${index + 1} shirt size`, 64)
      }
    })

    const contactEmail = trimRequiredAdminDetail(args.contactEmail, 'Contact email', 320).toLowerCase()
    const updatedAt = Date.now()

    await Promise.all([
      ctx.db.patch(args.subscriptionId, {
        team_name: trimOptionalAdminDetail(args.teamName, 'Team name', 120),
        contact_email: contactEmail,
        contact_phone: trimOptionalAdminDetail(args.contactPhone, 'Contact phone', 64),
        handicap_index: trimOptionalAdminDetail(args.handicapIndex, 'Handicap', 64),
        division: trimOptionalAdminDetail(args.division, 'Division', 120),
        updatedAt
      }),
      ...preparedRegistrations.map((registration) =>
        ctx.db.patch(registration.registrationId, {
          player_name: registration.playerName,
          player_email: registration.playerEmail,
          player_phone: registration.playerPhone,
          handicap_index: registration.handicapIndex,
          division: registration.division,
          shirt_size: registration.shirtSize
        })
      )
    ])

    return {
      subscriptionId: args.subscriptionId,
      updatedRegistrationCount: preparedRegistrations.length
    }
  }
})

export const generateReceiptUploadUrl = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    formId: v.string(),
    ownerUserIds: v.array(v.string())
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription || !args.ownerUserIds.includes(subscription.user_id)) {
      throw new ConvexError('Subscription not found.')
    }

    if (subscription.form_id !== args.formId) {
      throw new ConvexError('Receipt does not match this entry request.')
    }

    if (isSubscriptionEntryLocked(subscription)) {
      throw new ConvexError('Payment proof has already been submitted for this entry.')
    }

    return await ctx.storage.generateUploadUrl()
  }
})

export const updateReceipt = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    formId: v.string(),
    storageId: v.id('_storage'),
    ownerUserIds: v.array(v.string())
  },
  returns: v.object({
    subscriptionId: v.id('subscriptions'),
    receiptImageUrl: v.string()
  }),
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription || !args.ownerUserIds.includes(subscription.user_id)) {
      throw new ConvexError('Subscription not found.')
    }

    if (subscription.form_id !== args.formId) {
      throw new ConvexError('Receipt does not match this entry request.')
    }

    if (isSubscriptionEntryLocked(subscription)) {
      throw new ConvexError('Payment proof has already been submitted for this entry.')
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
    userIds: v.array(v.string())
  },
  returns: v.object({
    subscriptionId: v.id('subscriptions'),
    status: v.string()
  }),
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription || !args.userIds.includes(subscription.user_id)) {
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

export const confirmForAdmin = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    tournamentId: v.string(),
    confirmedById: v.string(),
    confirmedByEmail: v.optional(v.string()),
    confirmedByName: v.optional(v.string())
  },
  returns: adminStatusChangeResult,
  handler: async (ctx, args) => {
    return await applyAdminStatus(ctx, {
      subscriptionId: args.subscriptionId,
      tournamentId: args.tournamentId,
      action: 'confirm_payment',
      actor: {
        id: args.confirmedById,
        email: args.confirmedByEmail,
        name: args.confirmedByName
      }
    })
  }
})

export const updateStatusForAdmin = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    tournamentId: v.string(),
    action: adminSubscriptionStatusAction,
    adminId: v.string(),
    adminEmail: v.optional(v.string()),
    adminName: v.optional(v.string())
  },
  returns: adminStatusChangeResult,
  handler: async (ctx, args) => {
    return await applyAdminStatus(ctx, {
      subscriptionId: args.subscriptionId,
      tournamentId: args.tournamentId,
      action: args.action,
      actor: {
        id: args.adminId,
        email: args.adminEmail,
        name: args.adminName
      }
    })
  }
})

export const undoStatusForAdmin = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    tournamentId: v.string(),
    adminId: v.string(),
    adminEmail: v.optional(v.string()),
    adminName: v.optional(v.string())
  },
  returns: adminStatusChangeResult,
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription || subscription.tournament_id !== args.tournamentId) {
      throw new ConvexError('Subscription not found.')
    }

    const currentChangeId = subscription.admin_status_change_id
    if (!currentChangeId) {
      throw new ConvexError('There is no admin status update to undo.')
    }

    const currentChange = await ctx.db.get(currentChangeId)
    if (
      !currentChange ||
      currentChange.subscription_id !== args.subscriptionId ||
      currentChange.undone_at !== undefined
    ) {
      throw new ConvexError('The latest status update cannot be undone.')
    }

    await ctx.db.patch(args.subscriptionId, toStatusPatch(currentChange.previous, currentChange.previous_change_id))

    await reconcileSubscriptionTickets(ctx, subscription, currentChange.previous.payment_status, false)

    const adminEmail = trimOrUndefined(args.adminEmail)
    const adminName = trimOrUndefined(args.adminName)
    await ctx.db.patch(currentChangeId, {
      undone_at: Date.now(),
      undone_by_id: args.adminId,
      undone_by_email: adminEmail,
      undone_by_name: adminName
    })

    return getAdminStatusResult(args.subscriptionId, currentChange.previous, Boolean(currentChange.previous_change_id))
  }
})

export const updateAdminRemarks = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    remarks: v.string()
  },
  returns: v.object({
    subscriptionId: v.id('subscriptions'),
    admin_remarks: v.string()
  }),
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)

    if (!subscription) {
      throw new ConvexError('Subscription not found.')
    }

    const adminRemarks = args.remarks.trim()

    await ctx.db.patch(args.subscriptionId, {
      admin_remarks: adminRemarks
    })

    return {
      subscriptionId: args.subscriptionId,
      admin_remarks: adminRemarks
    }
  }
})
