import gleam/float
import gleam/int
import gleam/option.{type Option, None, Some}
import gleam/string

const missing_email_error = "Contact email is required."

const invalid_player_count_error = "Enter at least one player."

const excessive_player_count_error = "You can add up to 20 players per entry."

const invalid_payment_amount_error = "Payment amount is invalid."

pub opaque type PreparedTournamentSubscription {
  PreparedTournamentSubscription(
    team_name: Option(String),
    contact_email: String,
    contact_phone: Option(String),
    total_players: Int,
    payment_amount: Int,
    handicap_index: Option(String),
    division: Option(String),
  )
}

@external(javascript, "./tournament_entry_ffi.mjs", "isFiniteNumber")
fn is_finite_number(value: Float) -> Bool

pub fn prepare_tournament_subscription(
  team_name: String,
  email: String,
  phone: String,
  player_count: String,
  payment_amount: Float,
  handicap_index: String,
  division: String,
) -> Result(PreparedTournamentSubscription, String) {
  let contact_email =
    email
    |> string.trim
    |> string.lowercase

  case contact_email {
    "" -> Error(missing_email_error)
    _ ->
      case int.parse(string.trim(player_count)) {
        Error(_) -> Error(invalid_player_count_error)
        Ok(total_players) if total_players < 1 ->
          Error(invalid_player_count_error)
        Ok(total_players) if total_players > 20 ->
          Error(excessive_player_count_error)
        Ok(total_players) ->
          case is_finite_number(payment_amount) {
            False -> Error(invalid_payment_amount_error)
            True ->
              Ok(PreparedTournamentSubscription(
                team_name: normalize_optional(team_name),
                contact_email: contact_email,
                contact_phone: normalize_optional(phone),
                total_players: total_players,
                payment_amount: payment_amount |> float.round |> int.max(0),
                handicap_index: normalize_optional(handicap_index),
                division: normalize_optional(division),
              ))
          }
      }
  }
}

pub fn prepared_team_name(prepared: PreparedTournamentSubscription) -> String {
  optional_string(prepared.team_name)
}

pub fn prepared_contact_email(
  prepared: PreparedTournamentSubscription,
) -> String {
  prepared.contact_email
}

pub fn prepared_contact_phone(
  prepared: PreparedTournamentSubscription,
) -> String {
  optional_string(prepared.contact_phone)
}

pub fn prepared_total_players(prepared: PreparedTournamentSubscription) -> Int {
  prepared.total_players
}

pub fn prepared_payment_amount(
  prepared: PreparedTournamentSubscription,
) -> Int {
  prepared.payment_amount
}

pub fn prepared_handicap_index(
  prepared: PreparedTournamentSubscription,
) -> String {
  optional_string(prepared.handicap_index)
}

pub fn prepared_division(prepared: PreparedTournamentSubscription) -> String {
  optional_string(prepared.division)
}

fn normalize_optional(value: String) -> Option(String) {
  case string.trim(value) {
    "" -> None
    trimmed -> Some(trimmed)
  }
}

fn optional_string(value: Option(String)) -> String {
  case value {
    Some(value) -> value
    None -> ""
  }
}
