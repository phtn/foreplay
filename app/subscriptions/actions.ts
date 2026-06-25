'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseSubscriptionUserIds } from '@/lib/firebase/server-session'
import { fetchMutation } from 'convex/nextjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function cancelSubscription(formData: FormData) {
  const subscriptionId = formData.get('subscriptionId')

  if (typeof subscriptionId !== 'string' || !subscriptionId) {
    throw new Error('Subscription is required.')
  }

  const session = await getVerifiedFirebaseSession()

  if (!session) {
    throw new Error('You must be signed in to cancel a subscription.')
  }

  await fetchMutation(api.subscriptions.m.cancel, {
    subscriptionId: subscriptionId as Id<'subscriptions'>,
    userIds: buildFirebaseSubscriptionUserIds(session.decodedToken)
  })

  revalidatePath('/subscriptions')
  revalidatePath(`/subscriptions/${subscriptionId}`)
  redirect('/subscriptions')
}
