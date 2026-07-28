import { ConvexError } from 'convex/values'
import type { Doc } from '../_generated/dataModel'

type TournamentSupport = NonNullable<Doc<'tournaments'>['support']>

const trimOptionalWithLimit = (value: string | undefined, label: string, maxLength: number) => {
  const trimmed = value?.trim()

  if (trimmed && trimmed.length > maxLength) {
    throw new ConvexError(`${label} must be ${maxLength} characters or fewer.`)
  }

  return trimmed || undefined
}

export const normalizeTournamentSupport = (
  support: TournamentSupport | undefined
): TournamentSupport | undefined => {
  const name = trimOptionalWithLimit(support?.name, 'Support name', 120)
  const title = trimOptionalWithLimit(support?.title, 'Support title', 120)
  const email = trimOptionalWithLimit(support?.email, 'Support email', 320)?.toLowerCase()
  const phone = trimOptionalWithLimit(support?.phone, 'Support phone', 64)
  const secondaryName = trimOptionalWithLimit(support?.secondaryName, 'Secondary support name', 120)
  const secondaryTitle = trimOptionalWithLimit(support?.secondaryTitle, 'Secondary support title', 120)
  const secondaryEmail = trimOptionalWithLimit(
    support?.secondaryEmail,
    'Secondary support email',
    320
  )?.toLowerCase()
  const secondaryPhone = trimOptionalWithLimit(support?.secondaryPhone, 'Secondary support phone', 64)

  if (
    !name &&
    !title &&
    !email &&
    !phone &&
    !secondaryName &&
    !secondaryTitle &&
    !secondaryEmail &&
    !secondaryPhone
  ) {
    return undefined
  }

  return {
    ...(name ? { name } : {}),
    ...(title ? { title } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(secondaryName ? { secondaryName } : {}),
    ...(secondaryTitle ? { secondaryTitle } : {}),
    ...(secondaryEmail ? { secondaryEmail } : {}),
    ...(secondaryPhone ? { secondaryPhone } : {})
  }
}
