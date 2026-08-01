import {
  get_tournament_registration_action,
  registration_action_exists,
  registration_action_update_href,
  registration_action_update_label,
  TournamentRegistration$TournamentRegistration
} from 'gts/registration_action.mjs'

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

const toGleamRegistration = (registration: TournamentRegistration) =>
  TournamentRegistration$TournamentRegistration(
    registration._id,
    registration.form_id ?? '',
    registration.payment_status,
    Boolean(registration.receipt_image_url),
    registration.status ?? ''
  )

export function getTournamentRegistrationAction(
  tournamentId: string,
  registrations: readonly TournamentRegistration[]
): TournamentRegistrationAction | null {
  const action = get_tournament_registration_action(
    tournamentId,
    registrations.map(toGleamRegistration)
  )

  if (!registration_action_exists(action)) {
    return null
  }

  return {
    updateLabel: registration_action_update_label(action),
    updateHref: registration_action_update_href(action)
  }
}
