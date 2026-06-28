'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  getFirebaseUserByUid,
  mergeFirebaseCustomUserClaims,
  setFirebaseCustomUserClaims
} from '@/lib/firebase/admin'
import {
  isFirebaseCustomClaimValue,
  type FirebaseCustomClaimValue,
  type FirebaseCustomClaims
} from '@/lib/firebase/custom-claims'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchMutation } from 'convex/nextjs'
import { revalidatePath } from 'next/cache'

const claimKeyPattern = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/

function getRequiredFormString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} is required.`)
  }

  return value.trim()
}

function parseClaimValue(value: string): FirebaseCustomClaimValue {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error('Claim value is required.')
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown

    if (isFirebaseCustomClaimValue(parsed)) {
      return parsed
    }
  } catch {
    // Plain text values are accepted below.
  }

  return trimmed
}

function validateClaimKey(claimKey: string) {
  if (!claimKeyPattern.test(claimKey)) {
    throw new Error('Claim key must start with a letter or underscore and contain only letters, numbers, or underscores.')
  }
}

async function getExistingCustomClaims(uid: string): Promise<FirebaseCustomClaims> {
  const user = await getFirebaseUserByUid(uid)
  return user.customClaims ? { ...(user.customClaims as FirebaseCustomClaims) } : {}
}

export async function setCustomClaim(formData: FormData) {
  const session = await requireAdminSession()
  const uid = getRequiredFormString(formData, 'uid')
  const claimKey = getRequiredFormString(formData, 'claimKey')
  const claimValue = parseClaimValue(getRequiredFormString(formData, 'claimValue'))

  validateClaimKey(claimKey)

  if (uid === session.decodedToken.sub && claimKey === 'admin' && claimValue !== true) {
    throw new Error('You cannot remove your own admin access from this page.')
  }

  await mergeFirebaseCustomUserClaims(uid, {
    [claimKey]: claimValue
  })

  revalidatePath('/admin/config')
}

export async function grantAdminClaim(formData: FormData) {
  const uid = getRequiredFormString(formData, 'uid')

  await requireAdminSession()
  await mergeFirebaseCustomUserClaims(uid, { admin: true })

  revalidatePath('/admin/config')
}

export async function removeCustomClaim(formData: FormData) {
  const session = await requireAdminSession()
  const uid = getRequiredFormString(formData, 'uid')
  const claimKey = getRequiredFormString(formData, 'claimKey')

  validateClaimKey(claimKey)

  if (uid === session.decodedToken.sub && claimKey === 'admin') {
    throw new Error('You cannot remove your own admin access from this page.')
  }

  const nextClaims = await getExistingCustomClaims(uid)
  delete nextClaims[claimKey]

  await setFirebaseCustomUserClaims(uid, Object.keys(nextClaims).length ? nextClaims : null)

  revalidatePath('/admin/config')
}

type SaveManualPaymentMethodInput = {
  id?: Id<'paymentMethods'>
  bankOrEwallet: string
  accountName: string
  accountNumber: string
  qrCodeStorageId?: Id<'_storage'>
  qrCodeContent?: string
  isActive: boolean
}

export async function generatePaymentMethodQrUploadUrl() {
  await requireAdminSession()

  return await fetchMutation(api.paymentMethods.m.generateQrCodeUploadUrl)
}

export async function saveManualPaymentMethod(input: SaveManualPaymentMethodInput) {
  await requireAdminSession()

  const paymentMethodId = await fetchMutation(api.paymentMethods.m.upsertManual, input)

  revalidatePath('/admin/config')

  return { paymentMethodId }
}
