import gleam/javascript/array.{type Array}
import gleam/list
import gleam/string

pub type TournamentRegistration {
  TournamentRegistration(
    id: String,
    form_id: String,
    payment_status: String,
    has_receipt_image: Bool,
    status: String,
  )
}

type TournamentRegistrationState {
  PendingPayment
  PaymentReview
  Confirmed
  Inactive
}

type ClassifiedRegistration {
  ClassifiedRegistration(
    registration: TournamentRegistration,
    state: TournamentRegistrationState,
  )
}

pub opaque type TournamentRegistrationAction {
  NoRegistrationAction
  TournamentRegistrationAction(update_label: String, update_href: String)
}

@external(javascript, "./registration_action_ffi.mjs", "normalizeStateValue")
fn normalize_state_value(value: String) -> String

@external(javascript, "./registration_action_ffi.mjs", "encodeUriComponent")
fn encode_uri_component(value: String) -> String

@external(javascript, "./registration_action_ffi.mjs", "formIdSearchParams")
fn form_id_search_params(form_id: String) -> String

pub fn get_tournament_registration_action(
  tournament_id: String,
  registrations: Array(TournamentRegistration),
) -> TournamentRegistrationAction {
  let registrations_by_state =
    registrations
    |> array.to_list
    |> list.map(fn(registration) {
      ClassifiedRegistration(
        registration: registration,
        state: registration_state(registration),
      )
    })

  case find_registration(registrations_by_state, PendingPayment) {
    Ok(registration) -> pending_registration_action(tournament_id, registration)
    Error(_) ->
      case find_registration(registrations_by_state, PaymentReview) {
        Ok(registration) ->
          subscription_action(registration, "View Payment Status")
        Error(_) ->
          case find_registration(registrations_by_state, Confirmed) {
            Ok(registration) ->
              subscription_action(registration, "Payment Confirmed")
            Error(_) -> NoRegistrationAction
          }
      }
  }
}

pub fn registration_action_exists(
  action: TournamentRegistrationAction,
) -> Bool {
  case action {
    NoRegistrationAction -> False
    TournamentRegistrationAction(_, _) -> True
  }
}

pub fn registration_action_update_label(
  action: TournamentRegistrationAction,
) -> String {
  case action {
    NoRegistrationAction -> ""
    TournamentRegistrationAction(update_label, _) -> update_label
  }
}

pub fn registration_action_update_href(
  action: TournamentRegistrationAction,
) -> String {
  case action {
    NoRegistrationAction -> ""
    TournamentRegistrationAction(_, update_href) -> update_href
  }
}

fn registration_state(
  registration: TournamentRegistration,
) -> TournamentRegistrationState {
  let status = normalize_state_value(registration.status)
  let payment_status = normalize_state_value(registration.payment_status)

  case
    is_inactive_state(status) || is_inactive_state(payment_status),
    is_confirmed_state(status)
    || is_confirmed_state(payment_status)
    || payment_status == "paid",
    is_payment_review_state(status)
    || is_payment_review_state(payment_status)
    || registration.has_receipt_image,
    string.is_empty(status)
    || is_pending_payment_state(status)
    || is_pending_payment_state(payment_status)
  {
    True, _, _, _ -> Inactive
    False, True, _, _ -> Confirmed
    False, False, True, _ -> PaymentReview
    False, False, False, True -> PendingPayment
    False, False, False, False -> Inactive
  }
}

fn is_confirmed_state(value: String) -> Bool {
  case value {
    "confirm_payment" | "confirmed" | "payment_confirmed" -> True
    _ -> False
  }
}

fn is_payment_review_state(value: String) -> Bool {
  case value {
    "awaiting_payment_confirmation"
    | "payment_review"
    | "pending_verification" -> True
    _ -> False
  }
}

fn is_pending_payment_state(value: String) -> Bool {
  case value {
    "failed" | "pending" | "pending_payment" | "pending_upload" | "rejected" ->
      True
    _ -> False
  }
}

fn is_inactive_state(value: String) -> Bool {
  case value {
    "cancelled" | "refunded" -> True
    _ -> False
  }
}

fn find_registration(
  registrations: List(ClassifiedRegistration),
  state: TournamentRegistrationState,
) -> Result(TournamentRegistration, Nil) {
  case list.find(registrations, fn(item) { item.state == state }) {
    Ok(item) -> Ok(item.registration)
    Error(reason) -> Error(reason)
  }
}

fn pending_registration_action(
  tournament_id: String,
  registration: TournamentRegistration,
) -> TournamentRegistrationAction {
  case string.trim(registration.form_id) {
    "" -> subscription_action(registration, "View Payment Status")
    form_id ->
      TournamentRegistrationAction(
        update_label: "Update and Resume",
        update_href: "/tournaments/"
          <> encode_uri_component(tournament_id)
          <> "/entry?"
          <> form_id_search_params(form_id),
      )
  }
}

fn subscription_action(
  registration: TournamentRegistration,
  update_label: String,
) -> TournamentRegistrationAction {
  TournamentRegistrationAction(
    update_label: update_label,
    update_href: "/subscriptions/" <> encode_uri_component(registration.id),
  )
}
