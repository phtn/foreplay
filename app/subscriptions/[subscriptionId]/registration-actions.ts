'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseTokenIdentifier } from '@/lib/firebase/server-session'
import { fetchMutation } from 'convex/nextjs'
import { revalidatePath } from 'next/cache'

type CreateSubscriptionRegistrationInput = {
  subscriptionId: Id<'subscriptions'>
  playerName: string
  playerEmail?: string
  playerPhone?: string
  handicapIndex?: string
  division?: string
  shirtSize: string
}

export async function createSubscriptionRegistration(input: CreateSubscriptionRegistrationInput) {
  const session = await getVerifiedFirebaseSession()

  if (!session) {
    throw new Error('You must be signed in to register a player.')
  }

  await fetchMutation(api.registrations.m.createForSubscription, {
    subscriptionId: input.subscriptionId,
    userId: buildFirebaseTokenIdentifier(session.decodedToken),
    playerName: input.playerName,
    playerEmail: input.playerEmail,
    playerPhone: input.playerPhone,
    handicapIndex: input.handicapIndex,
    division: input.division,
    shirtSize: input.shirtSize
  })

  revalidatePath(`/subscriptions/${input.subscriptionId}`)
}
