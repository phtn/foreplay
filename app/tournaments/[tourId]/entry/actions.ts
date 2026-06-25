'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseSubscriptionUserIds, buildFirebaseUserId } from '@/lib/firebase/server-session'
import { fetchMutation } from 'convex/nextjs'

type CreateTournamentSubscriptionInput = {
  tourId: string
  formId: string
  teamName?: string
  email: string
  phone?: string
  playerCount: string
  paymentAmount: number
  handicapIndex?: string
  division?: string
}

type UpdateTournamentSubscriptionReceiptInput = {
  subscriptionId: Id<'subscriptions'>
  formId: string
  storageId: Id<'_storage'>
}

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export async function createTournamentSubscription(input: CreateTournamentSubscriptionInput) {
  const email = input.email.trim().toLowerCase()
  const phone = input.phone?.trim()
  const totalPlayers = Number.parseInt(input.playerCount, 10)
  const paymentAmount = Math.max(0, Math.round(input.paymentAmount))

  if (!email) {
    throw new Error('Contact email is required.')
  }

  if (!Number.isFinite(totalPlayers) || totalPlayers < 1) {
    throw new Error('Enter at least one player.')
  }

  if (!Number.isFinite(paymentAmount)) {
    throw new Error('Payment amount is invalid.')
  }

  const session = await getVerifiedFirebaseSession()
  if (!session) {
    throw new Error('You must be signed in to create an entry.')
  }

  const userId = buildFirebaseUserId(session.decodedToken)

  return await fetchMutation(api.subscriptions.m.create, {
    userId,
    ownerUserIds: buildFirebaseSubscriptionUserIds(session.decodedToken),
    tournamentId: input.tourId,
    formId: input.formId,
    teamName: trimOrUndefined(input.teamName),
    contactEmail: email,
    contactPhone: trimOrUndefined(phone),
    totalPlayers,
    paymentAmount,
    handicapIndex: trimOrUndefined(input.handicapIndex),
    division: trimOrUndefined(input.division)
  })
}

export async function generateReceiptUploadUrl() {
  return await fetchMutation(api.subscriptions.m.generateReceiptUploadUrl)
}

export async function updateTournamentSubscriptionReceipt(input: UpdateTournamentSubscriptionReceiptInput) {
  return await fetchMutation(api.subscriptions.m.updateReceipt, {
    subscriptionId: input.subscriptionId,
    formId: input.formId,
    storageId: input.storageId
  })
}
