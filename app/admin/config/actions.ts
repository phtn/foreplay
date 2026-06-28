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

type CreateTournamentEventInput = {
  id: string
  title: string
  venue: string
  date: string
  time: string
  registrationFee?: number
  slotsLimit?: number
  divisions?: string[]
  description?: string
  ticketLogoStorageId?: Id<'_storage'>
  coverPhotoStorageId?: Id<'_storage'>
  published: boolean
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function formatEventDate(date: string, time: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Manila'
  }).format(new Date(`${date}T${time}:00+08:00`))
}

export async function generatePaymentMethodQrUploadUrl() {
  await requireAdminSession()

  return await fetchMutation(api.paymentMethods.m.generateQrCodeUploadUrl)
}

export async function generateEventAssetUploadUrl() {
  await requireAdminSession()

  return await fetchMutation(api.tournaments.m.generateAssetUploadUrl)
}

export async function saveManualPaymentMethod(input: SaveManualPaymentMethodInput) {
  await requireAdminSession()

  const paymentMethodId = await fetchMutation(api.paymentMethods.m.upsertManual, input)

  revalidatePath('/admin/config')

  return { paymentMethodId }
}

export async function createTournamentEvent(input: CreateTournamentEventInput) {
  await requireAdminSession()

  const id = input.id.trim().toLowerCase()
  const title = input.title.trim()
  const venue = input.venue.trim()
  const date = input.date.trim()
  const time = input.time.trim()
  const gateOpenAt = new Date(`${date}T${time}:00+08:00`).getTime()

  if (!id || !title || !venue || !date || !time) {
    throw new Error('Event title, slug, venue, date, and time are required.')
  }

  if (!slugPattern.test(id)) {
    throw new Error('Event slug must use lowercase letters, numbers, and hyphens.')
  }

  if (!Number.isFinite(gateOpenAt)) {
    throw new Error('Event date and time are invalid.')
  }

  if (input.registrationFee !== undefined && !Number.isFinite(input.registrationFee)) {
    throw new Error('registrationFee must be a valid number.')
  }

  if (input.slotsLimit !== undefined && !Number.isFinite(input.slotsLimit)) {
    throw new Error('slotsLimit must be a valid number.')
  }

  await fetchMutation(api.tournaments.m.create, {
    id,
    title,
    venue,
    eventDate: formatEventDate(date, time),
    gateOpenAt,
    registrationFee: input.registrationFee ?? 0,
    slotsLimit: input.slotsLimit,
    divisions: input.divisions ?? [],
    description: input.description?.trim() || undefined,
    ticketLogoStorageId: input.ticketLogoStorageId,
    coverPhotoStorageId: input.coverPhotoStorageId,
    published: input.published
  })

  revalidatePath('/admin/config')
  revalidatePath('/admin')
}
