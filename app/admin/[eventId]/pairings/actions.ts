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
  registrationId: Id<'registrations'>
  startHole?: number
}

export async function updateRegistrationPairing(input: UpdateRegistrationPairingInput) {
  await requireAdminSession()

  await fetchMutation(api.registrations.m.updatePairingForAdmin, {
    registrationId: input.registrationId,
    startHole: input.startHole,
    pairingGroup: input.pairingGroup
  })

  revalidatePath(`/admin/${input.eventId}/pairings`)
}
