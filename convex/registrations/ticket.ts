import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'
import type { SubscriptionPaymentStatus } from '../subscriptions/adminStatus'

export const MAX_REGISTRATIONS_PER_SUBSCRIPTION = 20

type RegistrationDocument = Omit<
  Doc<'registrations'>,
  '_creationTime' | '_id'
>

interface BuildRegistrationDocumentArgs {
  division?: string
  handicapIndex?: string
  paymentStatus?: SubscriptionPaymentStatus
  playerEmail?: string
  playerId: string
  playerName: string
  playerPhone?: string
  shirtSize: string
  subscription: Doc<'subscriptions'>
  ticketToken: string
  userId: string
}

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const buildRegistrationDocument = ({
  division,
  handicapIndex,
  paymentStatus,
  playerEmail,
  playerId,
  playerName,
  playerPhone,
  shirtSize,
  subscription,
  ticketToken,
  userId
}: BuildRegistrationDocumentArgs): RegistrationDocument => ({
  user_id: userId,
  tournament_id: subscription.tournament_id,
  subscription_id: subscription._id,
  player_id: playerId,
  player_name: playerName.trim(),
  player_email: trimOrUndefined(playerEmail)?.toLowerCase(),
  player_phone: trimOrUndefined(playerPhone),
  handicap_index: trimOrUndefined(handicapIndex),
  division: trimOrUndefined(division) ?? subscription.division,
  shirt_size: shirtSize.trim(),
  payment_status: paymentStatus ?? subscription.payment_status,
  receipt_image_url: subscription.receipt_image_url,
  txn_ref_no: subscription.txn_ref_no,
  checked_in: false,
  ticket_token: ticketToken
})

const getAutomaticPlayerName = (
  subscription: Doc<'subscriptions'>
) =>
  trimOrUndefined(subscription.team_name) ??
  trimOrUndefined(subscription.contact_email) ??
  trimOrUndefined(subscription.txn_ref_no) ??
  trimOrUndefined(subscription.form_id) ??
  'Confirmed player'

const getSubscriptionRegistrations = async (
  ctx: MutationCtx,
  subscriptionId: Id<'subscriptions'>
) => {
  const registrations = await ctx.db
    .query('registrations')
    .withIndex('by_subscriptionId', (query) =>
      query.eq('subscription_id', subscriptionId)
    )
    .take(MAX_REGISTRATIONS_PER_SUBSCRIPTION + 1)

  if (registrations.length > MAX_REGISTRATIONS_PER_SUBSCRIPTION) {
    throw new Error(
      'This subscription has more registrations than the supported limit.'
    )
  }

  return registrations
}

export const reconcileSubscriptionTickets = async (
  ctx: MutationCtx,
  subscription: Doc<'subscriptions'>,
  paymentStatus: SubscriptionPaymentStatus,
  ensurePrimaryTicket: boolean
) => {
  const registrations = await getSubscriptionRegistrations(
    ctx,
    subscription._id
  )

  if (ensurePrimaryTicket && registrations.length === 0) {
    const registrationId = await ctx.db.insert(
      'registrations',
      buildRegistrationDocument({
        division: subscription.division,
        handicapIndex: subscription.handicap_index,
        paymentStatus,
        playerEmail: subscription.contact_email,
        playerId: crypto.randomUUID(),
        playerName: getAutomaticPlayerName(subscription),
        playerPhone: subscription.contact_phone,
        shirtSize: 'N/A',
        subscription,
        ticketToken: crypto.randomUUID(),
        userId: subscription.user_id
      })
    )

    return [registrationId]
  }

  await Promise.all(
    registrations
      .filter(
        (registration) =>
          registration.payment_status !== paymentStatus
      )
      .map((registration) =>
        ctx.db.patch(registration._id, {
          payment_status: paymentStatus
        })
      )
  )

  return registrations.map((registration) => registration._id)
}
