'use server'

import { createQRCodeSvg } from '@/components/qrcode/create-svg'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getVerifiedAdminSession, getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { buildFirebaseSubscriptionUserIds, buildFirebaseUserId } from '@/lib/firebase/server-session'
import { fetchMutation } from 'convex/nextjs'
import { ConvexError } from 'convex/values'
import {
  prepareCreateTournamentSubscription,
  type CreateTournamentSubscriptionInput
} from './prepare-subscription'

type UpdateTournamentSubscriptionReceiptInput = {
  subscriptionId: Id<'subscriptions'>
  formId: string
  storageId: Id<'_storage'>
}

type ReceiptTargetInput = {
  subscriptionId: Id<'subscriptions'>
  formId: string
}

const adminOverrideContentType = 'image/svg+xml;charset=utf-8'

const actionError = (error: unknown, fallback: string, operation: string) => {
  if (error instanceof ConvexError) {
    const data = error.data

    if (typeof data === 'string' && data.trim()) {
      return { ok: false, error: data.trim() } as const
    }

    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return { ok: false, error: data.message } as const
    }
  }

  console.error(`[tournament-entry] ${operation} failed`, error)
  return { ok: false, error: fallback } as const
}

export async function createTournamentSubscription(input: CreateTournamentSubscriptionInput) {
  const prepared = prepareCreateTournamentSubscription(input)

  if (!prepared.ok) {
    return prepared
  }

  try {
    const session = await getVerifiedFirebaseSession()
    if (!session) {
      return { ok: false, error: 'You must be signed in to create an entry.' } as const
    }

    const userId = buildFirebaseUserId(session.decodedToken)
    const result = await fetchMutation(api.subscriptions.m.create, {
      userId,
      ownerUserIds: buildFirebaseSubscriptionUserIds(session.decodedToken),
      tournamentId: input.tourId,
      formId: input.formId,
      teamName: prepared.value.teamName,
      contactEmail: prepared.value.contactEmail,
      contactPhone: prepared.value.contactPhone,
      totalPlayers: prepared.value.totalPlayers,
      paymentAmount: prepared.value.paymentAmount,
      handicapIndex: prepared.value.handicapIndex,
      division: prepared.value.division
    })

    return { ok: true, value: result } as const
  } catch (error) {
    return actionError(error, 'Unable to save this entry request.', 'save entry')
  }
}

export async function generateReceiptUploadUrl(input: ReceiptTargetInput) {
  try {
    const session = await getVerifiedFirebaseSession()
    if (!session) {
      return { ok: false, error: 'You must be signed in to upload a receipt.' } as const
    }

    const uploadUrl = await fetchMutation(api.subscriptions.m.generateReceiptUploadUrl, {
      subscriptionId: input.subscriptionId,
      formId: input.formId,
      ownerUserIds: buildFirebaseSubscriptionUserIds(session.decodedToken)
    })

    return { ok: true, value: uploadUrl } as const
  } catch (error) {
    return actionError(error, 'Unable to prepare this receipt upload.', 'generate receipt upload URL')
  }
}

export async function updateTournamentSubscriptionReceipt(input: UpdateTournamentSubscriptionReceiptInput) {
  try {
    const session = await getVerifiedFirebaseSession()
    if (!session) {
      return { ok: false, error: 'You must be signed in to submit a receipt.' } as const
    }

    const result = await fetchMutation(api.subscriptions.m.updateReceipt, {
      subscriptionId: input.subscriptionId,
      formId: input.formId,
      storageId: input.storageId,
      ownerUserIds: buildFirebaseSubscriptionUserIds(session.decodedToken)
    })

    return { ok: true, value: result } as const
  } catch (error) {
    return actionError(error, 'Unable to submit this receipt.', 'submit receipt')
  }
}

export async function submitAdminOverrideReceipt(input: ReceiptTargetInput) {
  try {
    const session = await getVerifiedAdminSession()
    if (!session) {
      return { ok: false, error: 'Admin access is required to submit an override.' } as const
    }

    const ownerUserIds = buildFirebaseSubscriptionUserIds(session.decodedToken)
    const uploadUrl = await fetchMutation(api.subscriptions.m.generateReceiptUploadUrl, {
      subscriptionId: input.subscriptionId,
      formId: input.formId,
      ownerUserIds
    })
    const qrContent = JSON.stringify({
      email: typeof session.decodedToken.email === 'string' ? session.decodedToken.email : '',
      name: typeof session.decodedToken.name === 'string' ? session.decodedToken.name : '',
      uid: session.decodedToken.uid
    })
    const receiptSvg = createQRCodeSvg({
      content: qrContent,
      width: 800,
      height: 800
    })
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': adminOverrideContentType
      },
      body: new Blob([receiptSvg], { type: adminOverrideContentType })
    })

    if (!uploadResponse.ok) {
      throw new Error('Unable to upload the admin override receipt.')
    }

    const uploadResult: unknown = await uploadResponse.json()

    if (
      !uploadResult ||
      typeof uploadResult !== 'object' ||
      !('storageId' in uploadResult) ||
      typeof uploadResult.storageId !== 'string'
    ) {
      throw new Error('The admin override upload returned an invalid storage ID.')
    }

    const result = await fetchMutation(api.subscriptions.m.updateReceipt, {
      subscriptionId: input.subscriptionId,
      formId: input.formId,
      storageId: uploadResult.storageId as Id<'_storage'>,
      ownerUserIds
    })

    return { ok: true, value: result } as const
  } catch (error) {
    return actionError(error, 'Unable to submit this admin override.', 'submit admin override')
  }
}
