import {
  commission_label,
  publication_label,
  registration_fee_label,
  slots_label,
  status_label
} from 'gts/formatters.mjs'

export const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
})

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeZone: 'Asia/Manila'
})

export const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila'
})

// const createdAtFormatter = new Intl.DateTimeFormat('en-US', {
//   dateStyle: 'medium',
//   timeStyle: 'short'
// })
export const createdAtNano = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short'
})

export function formatEventDate(timestamp: number, fallback: string) {
  return fallback || dateFormatter.format(new Date(timestamp))
}

export function formatGateOpenTime(timestamp: number) {
  return timeFormatter.format(new Date(timestamp))
}

// function formatCreatedAt(timestamp: number) {
//   return createdAtFormatter.format(timestamp)
// }
export function nanoCreatedAt(timestamp: number) {
  return createdAtNano.format(timestamp)
}

// function formatConfirmedAt(timestamp: number | undefined) {
//   return timestamp ? createdAtNano.format(timestamp) : null
// }

export function formatRegistrationFee(value: number) {
  return registration_fee_label(value, pesoFormatter.format(value))
}

export function formatSlotsLabel(registeredSlots: number, slotsLimit?: number) {
  return slots_label(registeredSlots, Boolean(slotsLimit), slotsLimit ?? 0)
}

export function getPublicationLabel(published: boolean | undefined) {
  return publication_label(published !== false)
}

export function formatCommission(type: string, value?: number) {
  return commission_label(type, value !== undefined, value === undefined ? '' : String(value))
}

export function formatStatus(value: string | undefined) {
  return status_label(value ?? 'pending_payment')
}
