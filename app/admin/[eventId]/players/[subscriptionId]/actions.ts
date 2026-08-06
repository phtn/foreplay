'use server'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getFirebaseAdminAuth } from '@/lib/firebase/admin'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { fetchMutation } from 'convex/nextjs'
import { ConvexError } from 'convex/values'
import { revalidatePath } from 'next/cache'

const MAX_REGISTRATIONS = 20

export type SaveRegistrationDetailsState = {
  message: string
  status: 'idle' | 'success' | 'error'
}

class RegistrationDetailsInputError extends Error {}

function readTextField(formData: FormData, name: string, label: string, maxLength: number, required = false) {
  const value = formData.get(name)

  if (value === null) {
    if (required) {
      throw new RegistrationDetailsInputError(`${label} is required.`)
    }

    return ''
  }

  if (typeof value !== 'string') {
    throw new RegistrationDetailsInputError(`${label} is invalid.`)
  }

  const trimmed = value.trim()

  if (required && !trimmed) {
    throw new RegistrationDetailsInputError(`${label} is required.`)
  }

  if (trimmed.length > maxLength) {
    throw new RegistrationDetailsInputError(`${label} must be ${maxLength} characters or fewer.`)
  }

  return trimmed
}

function getConvexErrorMessage(error: ConvexError<string>) {
  const data: unknown = error.data

  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string' &&
    data.message.trim()
  ) {
    return data.message.trim()
  }

  return 'Unable to save registration details.'
}

export async function saveRegistrationDetails(
  formData: FormData,
  firebaseIdToken: string
): Promise<SaveRegistrationDetailsState> {
  const session = await requireAdminSession()

  try {
    const adminAuth = getFirebaseAdminAuth()

    if (!adminAuth || typeof firebaseIdToken !== 'string' || !firebaseIdToken) {
      throw new RegistrationDetailsInputError('Your admin session is unavailable. Refresh the page and try again.')
    }

    const decodedIdToken = await adminAuth.verifyIdToken(firebaseIdToken, true)

    if (decodedIdToken.uid !== session.decodedToken.uid || decodedIdToken.admin !== true) {
      throw new RegistrationDetailsInputError('Your admin session is no longer valid. Sign in again and retry.')
    }

    const eventId = readTextField(formData, 'eventId', 'Event', 512, true)
    const subscriptionId = readTextField(formData, 'subscriptionId', 'Subscription', 512, true)
    const rawRegistrationIds = formData.getAll('registrationId')

    if (
      rawRegistrationIds.length > MAX_REGISTRATIONS ||
      rawRegistrationIds.some((registrationId) => typeof registrationId !== 'string' || !registrationId)
    ) {
      throw new RegistrationDetailsInputError('The player registration list is invalid.')
    }

    const registrationIds = rawRegistrationIds as string[]

    if (new Set(registrationIds).size !== registrationIds.length) {
      throw new RegistrationDetailsInputError('The player registration list contains duplicates.')
    }

    const registrations = registrationIds.map((registrationId, index) => {
      const prefix = `registration.${registrationId}`

      return {
        registrationId: registrationId as Id<'registrations'>,
        playerName: readTextField(formData, `${prefix}.playerName`, `Player ${index + 1} name`, 120, true),
        playerEmail: readTextField(formData, `${prefix}.playerEmail`, `Player ${index + 1} email`, 320),
        playerPhone: readTextField(formData, `${prefix}.playerPhone`, `Player ${index + 1} phone`, 64),
        handicapIndex: readTextField(formData, `${prefix}.handicapIndex`, `Player ${index + 1} handicap`, 64),
        division: readTextField(formData, `${prefix}.division`, `Player ${index + 1} division`, 120),
        shirtSize: readTextField(formData, `${prefix}.shirtSize`, `Player ${index + 1} shirt size`, 64)
      }
    })

    await fetchMutation(api.subscriptions.m.updateRegistrationDetailsForAdmin, {
      subscriptionId: subscriptionId as Id<'subscriptions'>,
      tournamentId: eventId,
      teamName: readTextField(formData, 'teamName', 'Team name', 120),
      contactEmail: readTextField(formData, 'contactEmail', 'Contact email', 320, true),
      contactPhone: readTextField(formData, 'contactPhone', 'Contact phone', 64),
      handicapIndex: readTextField(formData, 'handicapIndex', 'Handicap', 64),
      division: readTextField(formData, 'division', 'Division', 120),
      registrations
    }, {
      token: firebaseIdToken
    })

    const encodedEventId = encodeURIComponent(eventId)
    const encodedSubscriptionId = encodeURIComponent(subscriptionId)
    revalidatePath(`/admin/${encodedEventId}`)
    revalidatePath(`/admin/${encodedEventId}/players/${encodedSubscriptionId}`)

    return {
      status: 'success',
      message: registrations.length
        ? `Registration details saved for ${registrations.length} ${registrations.length === 1 ? 'player' : 'players'}.`
        : 'Entry contact details saved.'
    }
  } catch (error) {
    if (error instanceof RegistrationDetailsInputError) {
      return {
        status: 'error',
        message: error.message
      }
    }

    if (error instanceof ConvexError) {
      return {
        status: 'error',
        message: getConvexErrorMessage(error)
      }
    }

    console.error('[admin-registration-editor] Unable to save registration details.', error)
    return {
      status: 'error',
      message: 'Unable to save registration details. Try again.'
    }
  }
}
