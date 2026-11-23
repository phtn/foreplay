'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchMutation } from 'convex/nextjs'
import { revalidatePath } from 'next/cache'

type PairingGroup = 'A' | 'B' | 'C'

type UpdateRegistrationPairingInput = {
  eventId: string
  pairingGroup?: PairingGroup
  playerId: Id<'registrations'> | Id<'subscriptions'>
  startHole?: number
}

export async function updateRegistrationPairing(input: UpdateRegistrationPairingInput, firebaseIdToken: string) {
  await requireAdminSession()

  await fetchMutation(api.registrations.m.updatePairingForAdmin, {
    tournamentId: input.eventId,
    playerId: input.playerId,
    startHole: input.startHole,
    pairingGroup: input.pairingGroup
  }, { token: firebaseIdToken })

  revalidatePath(`/admin/${encodeURIComponent(input.eventId)}/pairings`)
}
