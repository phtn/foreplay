export type EntryPricingMode = 'flat' | 'per-player'

export type EntryPricingOption = {
  label: string
  value: string
  amount: number
  pricingMode: EntryPricingMode
}

export type EntryFormValues = {
  fullName: string
  email: string
  phone: string
  division: string
  playerCount: string
  handicapIndex: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const calculateEntryTotal = ({
  amount,
  players,
  pricingMode
}: {
  amount: number
  players: number
  pricingMode: EntryPricingMode
}) => {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0
  const safePlayers = Number.isFinite(players) ? Math.max(1, Math.round(players)) : 1
  return Math.round(pricingMode === 'flat' ? safeAmount : safeAmount * safePlayers)
}

export const validateEntryFormValues = (value: EntryFormValues) => {
  const fields: Partial<Record<keyof EntryFormValues, string>> = {}
  const playerCount = Number(value.playerCount)

  if (!value.email.trim()) {
    fields.email = 'Enter your email address.'
  } else if (!emailPattern.test(value.email.trim())) {
    fields.email = 'Enter a valid email address.'
  }

  if (!value.phone.trim()) {
    fields.phone = 'Enter your phone number.'
  }

  if (!Number.isInteger(playerCount) || playerCount < 1) {
    fields.playerCount = 'Enter at least one player.'
  } else if (playerCount > 20) {
    fields.playerCount = 'You can add up to 20 players per entry.'
  }

  if (!value.division.trim()) {
    fields.division = 'Select an entry option.'
  }

  return Object.keys(fields).length ? { fields } : undefined
}
