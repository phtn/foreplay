'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchMutation } from 'convex/nextjs'
import { revalidatePath } from 'next/cache'

export async function confirmSubscription(formData: FormData) {
  const subscriptionId = formData.get('subscriptionId')
  const eventId = formData.get('eventId')

  if (typeof subscriptionId !== 'string' || !subscriptionId) {
    throw new Error('Subscription is required.')
  }

  if (typeof eventId !== 'string' || !eventId) {
    throw new Error('Event is required.')
  }

  const session = await requireAdminSession()

  await fetchMutation(api.subscriptions.m.confirmForAdmin, {
    subscriptionId: subscriptionId as Id<'subscriptions'>,
    confirmedById: session.decodedToken.sub,
    confirmedByEmail: session.decodedToken.email,
    confirmedByName: typeof session.decodedToken.name === 'string' ? session.decodedToken.name : undefined
  })

  revalidatePath('/admin')
  revalidatePath(`/admin/${eventId}`)
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
