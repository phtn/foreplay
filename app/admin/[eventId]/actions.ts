'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchMutation } from 'convex/nextjs'
import { revalidatePath } from 'next/cache'
import {
  editableSubscriptionStatuses,
  type EditableSubscriptionStatus,
  type SubscriptionStatusActionInput
} from './subscription-status-actions'

const editableSubscriptionStatusSet = new Set<string>(
  editableSubscriptionStatuses
)

const validateStatusActionInput = ({
  eventId,
  subscriptionId
}: SubscriptionStatusActionInput) => {
  if (
    typeof subscriptionId !== 'string' ||
    subscriptionId.length === 0 ||
    subscriptionId.length > 512
  ) {
    throw new Error('Subscription is required.')
  }

  if (
    typeof eventId !== 'string' ||
    eventId.length === 0 ||
    eventId.length > 512
  ) {
    throw new Error('Event is required.')
  }

  return {
    eventId,
    subscriptionId: subscriptionId as Id<'subscriptions'>
  }
}

const getAdminActor = async () => {
  const session = await requireAdminSession()

  return {
    id: session.decodedToken.sub,
    email: session.decodedToken.email,
    name:
      typeof session.decodedToken.name === 'string'
        ? session.decodedToken.name
        : undefined
  }
}

const revalidateAdminEvent = (eventId: string) => {
  revalidatePath('/admin')
  revalidatePath(`/admin/${encodeURIComponent(eventId)}`)
}

export async function confirmSubscription(
  input: SubscriptionStatusActionInput
) {
  const { eventId, subscriptionId } =
    validateStatusActionInput(input)
  const actor = await getAdminActor()

  await fetchMutation(api.subscriptions.m.confirmForAdmin, {
    subscriptionId,
    tournamentId: eventId,
    confirmedById: actor.id,
    confirmedByEmail: actor.email,
    confirmedByName: actor.name
  })

  revalidateAdminEvent(eventId)
}

export async function updateSubscriptionStatus(
  input: SubscriptionStatusActionInput & {
    status: EditableSubscriptionStatus
  }
) {
  const { eventId, subscriptionId } =
    validateStatusActionInput(input)

  if (!editableSubscriptionStatusSet.has(input.status)) {
    throw new Error('Subscription status is invalid.')
  }

  const actor = await getAdminActor()
  await fetchMutation(api.subscriptions.m.updateStatusForAdmin, {
    subscriptionId,
    tournamentId: eventId,
    action: input.status,
    adminId: actor.id,
    adminEmail: actor.email,
    adminName: actor.name
  })

  revalidateAdminEvent(eventId)
}

export async function undoSubscriptionStatus(
  input: SubscriptionStatusActionInput
) {
  const { eventId, subscriptionId } =
    validateStatusActionInput(input)
  const actor = await getAdminActor()

  await fetchMutation(api.subscriptions.m.undoStatusForAdmin, {
    subscriptionId,
    tournamentId: eventId,
    adminId: actor.id,
    adminEmail: actor.email,
    adminName: actor.name
  })

  revalidateAdminEvent(eventId)
}

export async function updateSubscriptionRemarks(formData: FormData) {
  const subscriptionId = formData.get('subscriptionId')
  const eventId = formData.get('eventId')
  const remarks = formData.get('remarks')

  if (typeof subscriptionId !== 'string' || !subscriptionId) {
    throw new Error('Subscription is required.')
  }

  if (typeof eventId !== 'string' || !eventId) {
    throw new Error('Event is required.')
  }

  if (typeof remarks !== 'string') {
    throw new Error('Remarks are required.')
  }

  await requireAdminSession()

  await fetchMutation(api.subscriptions.m.updateAdminRemarks, {
    subscriptionId: subscriptionId as Id<'subscriptions'>,
    remarks
  })

  revalidatePath(`/admin/${eventId}`)
}
