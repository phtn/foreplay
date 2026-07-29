type TournamentRegistration = {
  _id: string
  form_id?: string
  payment_status: string
  receipt_image_url?: string
  status?: string
}

export type TournamentRegistrationAction = {
  updateLabel: string
  updateHref: string
}

type TournamentRegistrationState = 'pending_payment' | 'payment_review' | 'confirmed' | 'inactive'

const normalizeStateValue = (value: string | undefined) => {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, '_') ?? ''
}

const confirmedStates = new Set(['confirm_payment', 'confirmed', 'payment_confirmed'])
const paymentReviewStates = new Set([
  'awaiting_payment_confirmation',
  'payment_review',
  'pending_verification'
])
const pendingPaymentStates = new Set(['failed', 'pending', 'pending_payment', 'pending_upload', 'rejected'])
const inactiveStates = new Set(['cancelled', 'refunded'])

const getRegistrationState = (registration: TournamentRegistration): TournamentRegistrationState => {
  const status = normalizeStateValue(registration.status)
  const paymentStatus = normalizeStateValue(registration.payment_status)

  if (inactiveStates.has(status) || inactiveStates.has(paymentStatus)) {
    return 'inactive'
  }

  if (confirmedStates.has(status) || confirmedStates.has(paymentStatus) || paymentStatus === 'paid') {
    return 'confirmed'
  }

  if (
    paymentReviewStates.has(status) ||
    paymentReviewStates.has(paymentStatus) ||
    Boolean(registration.receipt_image_url)
  ) {
    return 'payment_review'
  }

  if (!status || pendingPaymentStates.has(status) || pendingPaymentStates.has(paymentStatus)) {
    return 'pending_payment'
  }

  return 'inactive'
}

const getSubscriptionHref = (registrationId: string) => {
  return `/subscriptions/${encodeURIComponent(registrationId)}`
}

export function getTournamentRegistrationAction(
  tournamentId: string,
  registrations: readonly TournamentRegistration[]
): TournamentRegistrationAction | null {
  const registrationsByState = registrations.map((registration) => ({
    registration,
    state: getRegistrationState(registration)
  }))
  const pendingRegistration = registrationsByState.find(({ state }) => state === 'pending_payment')?.registration

  if (pendingRegistration) {
    const formId = pendingRegistration.form_id?.trim()

    if (formId) {
      const entrySearchParams = new URLSearchParams({ formId })

      return {
        updateLabel: 'Update and Resume',
        updateHref: `/tournaments/${encodeURIComponent(tournamentId)}/entry?${entrySearchParams}`
      }
    }

    return {
      updateLabel: 'View Payment Status',
      updateHref: getSubscriptionHref(pendingRegistration._id)
    }
  }

  const paymentReviewRegistration = registrationsByState.find(({ state }) => state === 'payment_review')?.registration

  if (paymentReviewRegistration) {
    return {
      updateLabel: 'View Payment Status',
      updateHref: getSubscriptionHref(paymentReviewRegistration._id)
    }
  }

  const confirmedRegistration = registrationsByState.find(({ state }) => state === 'confirmed')?.registration

  if (confirmedRegistration) {
    return {
      updateLabel: 'Payment Confirmed',
      updateHref: getSubscriptionHref(confirmedRegistration._id)
    }
  }

  return null
}
