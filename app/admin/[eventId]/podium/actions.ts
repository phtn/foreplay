'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchMutation } from 'convex/nextjs'
import { revalidatePath } from 'next/cache'

type AssignPodiumAwardInput = {
  awardEyebrow: string
  awardKey: string
  awardTitle: string
  eventId: string
  position: number
  registrationId?: Id<'registrations'>
}

export async function assignPodiumAward(input: AssignPodiumAwardInput) {
  await requireAdminSession()

  await fetchMutation(api.podiumAwards.m.assign, {
    tournamentId: input.eventId,
    awardKey: input.awardKey,
    awardTitle: input.awardTitle,
    awardEyebrow: input.awardEyebrow,
    position: input.position,
    registrationId: input.registrationId
  })

  revalidatePath(`/admin/${input.eventId}/podium`)
}
