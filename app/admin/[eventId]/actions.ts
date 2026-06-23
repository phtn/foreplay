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

  await requireAdminSession()

  await fetchMutation(api.subscriptions.m.confirmForAdmin, {
    subscriptionId: subscriptionId as Id<'subscriptions'>
  })

  revalidatePath('/admin')
  revalidatePath(`/admin/${eventId}`)
}
