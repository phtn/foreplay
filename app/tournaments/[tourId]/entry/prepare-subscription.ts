import { Result$Error$0, Result$isError, Result$isOk, Result$Ok$0 } from 'gts/gleam.mjs'
import {
  prepare_tournament_subscription,
  prepared_contact_email,
  prepared_contact_phone,
  prepared_division,
  prepared_handicap_index,
  prepared_payment_amount,
  prepared_team_name,
  prepared_total_players
} from 'gts/tournament_entry.mjs'

export type CreateTournamentSubscriptionInput = {
  tourId: string
  formId: string
  teamName?: string
  email: string
  phone?: string
  playerCount: string
  paymentAmount: number
  handicapIndex?: string
  division?: string
}

const optionalString = (value: string) => value || undefined

export const prepareCreateTournamentSubscription = (input: CreateTournamentSubscriptionInput) => {
  const result = prepare_tournament_subscription(
    input.teamName ?? '',
    input.email,
    input.phone ?? '',
    input.playerCount,
    input.paymentAmount,
    input.handicapIndex ?? '',
    input.division ?? ''
  )
  const error = Result$Error$0(result)
  const prepared = Result$Ok$0(result)

  if (Result$isError(result)) {
    return {
      ok: false,
      error: typeof error === 'string' && error ? error : 'Unable to validate this entry request.'
    } as const
  }

  if (!Result$isOk(result) || !prepared) {
    return { ok: false, error: 'Unable to validate this entry request.' } as const
  }

  return {
    ok: true,
    value: {
      teamName: optionalString(prepared_team_name(prepared)),
      contactEmail: prepared_contact_email(prepared),
      contactPhone: optionalString(prepared_contact_phone(prepared)),
      totalPlayers: prepared_total_players(prepared),
      paymentAmount: prepared_payment_amount(prepared),
      handicapIndex: optionalString(prepared_handicap_index(prepared)),
      division: optionalString(prepared_division(prepared))
    }
  } as const
}
