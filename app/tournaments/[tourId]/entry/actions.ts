'use server'

import { api } from '@/convex/_generated/api'
import { buildFirebaseTokenIdentifier } from '@/lib/firebase/server-session'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { fetchMutation } from 'convex/nextjs'

type CreateTournamentSubscriptionInput = {
  tourId: string
  formId: string
  teamName?: string
  email: string
  phone: string
  playerCount: string
  handicapIndex?: string
  division?: string
}

const trimOrUndefined = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export async function createTournamentSubscription(input: CreateTournamentSubscriptionInput) {
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const totalPlayers = Number.parseInt(input.playerCount, 10)

  if (!email) {
    throw new Error('Contact email is required.')
  }

  if (!phone) {
    throw new Error('Contact phone is required.')
  }

  if (!Number.isFinite(totalPlayers) || totalPlayers < 1) {
    throw new Error('Enter at least one player.')
  }

  const session = await getVerifiedFirebaseSession()
  const userId = session ? buildFirebaseTokenIdentifier(session.decodedToken) : `email:${email}`

  return await fetchMutation(api.subscriptions.m.create, {
    userId,
    tournamentId: input.tourId,
    formId: input.formId,
    teamName: trimOrUndefined(input.teamName),
    contactEmail: email,
    contactPhone: phone,
    totalPlayers,
    handicapIndex: trimOrUndefined(input.handicapIndex),
    division: trimOrUndefined(input.division)
  })
}
