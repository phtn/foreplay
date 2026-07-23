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
  if (value <= 0) {
    return 'Sponsor-driven event'
  }

  return pesoFormatter.format(value)
}

export function formatSlotsLabel(registeredSlots: number, slotsLimit?: number) {
  if (slotsLimit) {
    return `${registeredSlots}/${slotsLimit}`
  }

  return `${registeredSlots}`
}

export function getPublicationLabel(published: boolean | undefined) {
  return published === false ? 'Draft' : 'Published'
}

export function formatCommission(type: string, value?: number) {
  if (value === undefined) {
    return 'Not configured'
  }

  return `${type} · ${value}`
}

export function formatStatus(value: string | undefined) {
  return (value ?? 'pending_payment')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
