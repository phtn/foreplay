import formatters
import gleam/javascript/array
import gleeunit
import registration_action
import staff_list_filter
import tournament_entry

@external(javascript, "./gts_test_ffi.mjs", "notANumber")
fn not_a_number() -> Float

pub fn main() -> Nil {
  gleeunit.main()
}

pub fn prepares_tournament_subscription_test() {
  let result =
    tournament_entry.prepare_tournament_subscription(
      "  Sunday Drivers  ",
      "  CAPTAIN@EXAMPLE.COM ",
      "  +63 900 000 0000  ",
      "4",
      1499.6,
      "  12.3  ",
      "  Open  ",
    )
  let assert Ok(prepared) = result

  assert tournament_entry.prepared_team_name(prepared) == "Sunday Drivers"
  assert tournament_entry.prepared_contact_email(prepared)
    == "captain@example.com"
  assert tournament_entry.prepared_contact_phone(prepared) == "+63 900 000 0000"
  assert tournament_entry.prepared_total_players(prepared) == 4
  assert tournament_entry.prepared_payment_amount(prepared) == 1500
  assert tournament_entry.prepared_handicap_index(prepared) == "12.3"
  assert tournament_entry.prepared_division(prepared) == "Open"
}

pub fn omits_blank_optional_fields_test() {
  let result =
    tournament_entry.prepare_tournament_subscription(
      " ",
      "player@example.com",
      "",
      "1",
      -10.0,
      "  ",
      "",
    )
  let assert Ok(prepared) = result

  assert tournament_entry.prepared_team_name(prepared) == ""
  assert tournament_entry.prepared_contact_phone(prepared) == ""
  assert tournament_entry.prepared_payment_amount(prepared) == 0
  assert tournament_entry.prepared_handicap_index(prepared) == ""
  assert tournament_entry.prepared_division(prepared) == ""
}

pub fn requires_contact_email_test() {
  assert prepare_with("  ", "2") == Error("Contact email is required.")
}

pub fn rejects_invalid_player_count_test() {
  assert prepare_with("player@example.com", "players")
    == Error("Enter at least one player.")
  assert prepare_with("player@example.com", "0")
    == Error("Enter at least one player.")
  assert prepare_with("player@example.com", "2.5")
    == Error("Enter at least one player.")
}

pub fn limits_player_count_test() {
  assert prepare_with("player@example.com", "21")
    == Error("You can add up to 20 players per entry.")
}

pub fn rejects_non_finite_payment_amount_test() {
  assert tournament_entry.prepare_tournament_subscription(
      "",
      "player@example.com",
      "",
      "2",
      not_a_number(),
      "",
      "",
    )
    == Error("Payment amount is invalid.")
}

fn prepare_with(email: String, player_count: String) {
  tournament_entry.prepare_tournament_subscription(
    "",
    email,
    "",
    player_count,
    100.0,
    "",
    "",
  )
}

pub fn formats_registration_fee_label_test() {
  assert formatters.registration_fee_label(0.0, "₱1,000")
    == "Sponsor-driven event"
  assert formatters.registration_fee_label(-1.0, "₱1,000")
    == "Sponsor-driven event"
  assert formatters.registration_fee_label(1000.0, "₱1,000") == "₱1,000"
}

pub fn formats_slots_label_test() {
  assert formatters.slots_label(12, True, 24) == "12/24"
  assert formatters.slots_label(12, False, 0) == "12"
}

pub fn formats_publication_label_test() {
  assert formatters.publication_label(True) == "Published"
  assert formatters.publication_label(False) == "Draft"
}

pub fn formats_commission_label_test() {
  assert formatters.commission_label("fixed", True, "0") == "fixed · 0"
  assert formatters.commission_label("fixed", False, "") == "Not configured"
}

pub fn formats_status_label_test() {
  assert formatters.status_label("pending_payment") == "Pending Payment"
  assert formatters.status_label("WAITING_review") == "WAITING Review"
  assert formatters.status_label("") == ""
}

pub fn resumes_pending_tournament_registration_test() {
  let action =
    registration_actions("som 2026", [
      registration(
        "subscription-pending",
        "entry 123",
        "pending",
        False,
        "pending_payment",
      ),
    ])

  assert_registration_action(
    action,
    "Update and Resume",
    "/tournaments/som%202026/entry?formId=entry+123",
  )
}

pub fn links_payment_review_to_subscription_test() {
  let action =
    registration_actions("som-2026", [
      registration(
        "subscription/review",
        "entry-456",
        "pending",
        False,
        "payment_review",
      ),
    ])

  assert_registration_action(
    action,
    "View Payment Status",
    "/subscriptions/subscription%2Freview",
  )
}

pub fn prioritizes_pending_tournament_registration_test() {
  let action =
    registration_actions("som-2026", [
      registration("subscription-confirmed", "", "paid", False, "confirmed"),
      registration(
        "subscription-review",
        "",
        "pending",
        False,
        "payment_review",
      ),
      registration(
        "subscription-pending",
        "entry-789",
        "pending",
        False,
        "pending_payment",
      ),
    ])

  assert_registration_action(
    action,
    "Update and Resume",
    "/tournaments/som-2026/entry?formId=entry-789",
  )
}

pub fn links_confirmed_tournament_registration_test() {
  let action =
    registration_actions("som-2026", [
      registration(
        "subscription/confirmed",
        "entry-confirmed",
        "paid",
        False,
        "confirmed",
      ),
    ])

  assert_registration_action(
    action,
    "Payment Confirmed",
    "/subscriptions/subscription%2Fconfirmed",
  )
}

pub fn supports_tournament_registration_lifecycle_aliases_test() {
  let review_action =
    registration_actions("som-2026", [
      registration(
        "subscription-legacy-review",
        "",
        "pending_verification",
        False,
        "",
      ),
      registration(
        "subscription-payment-confirmed",
        "",
        "pending",
        False,
        "payment_confirmed",
      ),
    ])
  let confirmed_action =
    registration_actions("som-2026", [
      registration(
        "subscription-payment-confirmed",
        "",
        "pending",
        False,
        "payment_confirmed",
      ),
    ])
  let pending_action =
    registration_actions("som-2026", [
      registration(
        "subscription-pending-upload",
        "legacy-entry",
        "pending_upload",
        False,
        "",
      ),
    ])

  assert_registration_action(
    review_action,
    "View Payment Status",
    "/subscriptions/subscription-legacy-review",
  )
  assert_registration_action(
    confirmed_action,
    "Payment Confirmed",
    "/subscriptions/subscription-payment-confirmed",
  )
  assert_registration_action(
    pending_action,
    "Update and Resume",
    "/tournaments/som-2026/entry?formId=legacy-entry",
  )
}

pub fn omits_inactive_tournament_registration_action_test() {
  let action =
    registration_actions("som-2026", [
      registration(
        "subscription-cancelled",
        "entry-cancelled",
        "pending",
        False,
        "cancelled",
      ),
      registration(
        "subscription-refunded",
        "entry-refunded",
        "refunded",
        False,
        "confirmed",
      ),
    ])

  assert registration_action.registration_action_exists(action) == False
}

fn registration_actions(
  tournament_id: String,
  registrations: List(registration_action.TournamentRegistration),
) -> registration_action.TournamentRegistrationAction {
  registration_action.get_tournament_registration_action(
    tournament_id,
    array.from_list(registrations),
  )
}

fn registration(
  id: String,
  form_id: String,
  payment_status: String,
  has_receipt_image: Bool,
  status: String,
) -> registration_action.TournamentRegistration {
  registration_action.TournamentRegistration(
    id: id,
    form_id: form_id,
    payment_status: payment_status,
    has_receipt_image: has_receipt_image,
    status: status,
  )
}

fn assert_registration_action(
  action: registration_action.TournamentRegistrationAction,
  update_label: String,
  update_href: String,
) {
  assert registration_action.registration_action_exists(action)
  assert registration_action.registration_action_update_label(action)
    == update_label
  assert registration_action.registration_action_update_href(action)
    == update_href
}

pub fn filters_default_staff_list_by_claim_test() {
  let users =
    [
      staff_user("regular-user", False, False, "", "regular-user", "", 1.0),
      staff_user("disabled-admin", False, False, "", "disabled-admin", "", 1.0),
      staff_user("staff-user", False, True, "", "staff-user", "", 2.0),
      staff_user("admin-user", True, False, "", "admin-user", "", 3.0),
      staff_user("staff-admin", True, True, "", "staff-admin", "", 4.0),
    ]
    |> array.from_list

  assert staff_list_filter.filter_staff_users(users, "")
    |> array.to_list
    == ["staff-admin", "admin-user", "staff-user"]
}

pub fn search_includes_users_without_staff_claims_test() {
  let users =
    [
      staff_user("staff-user", False, True, "", "staff-user", "", 1.0),
      staff_user(
        "regular-user",
        False,
        False,
        "golfer@example.com",
        "Maria Santos",
        "",
        1.0,
      ),
    ]
    |> array.from_list

  assert staff_list_filter.filter_staff_users(users, "GOLFER")
    |> array.to_list
    == ["regular-user"]
}

pub fn search_matches_normalized_terms_across_fields_test() {
  let users =
    [
      staff_user(
        "target-user-id",
        False,
        False,
        "",
        "Maria   Santos",
        "+63 917 555 0100",
        1.0,
      ),
      staff_user(
        "other-user-id",
        False,
        False,
        "",
        "Maria Reyes",
        "+63 905 111 0100",
        1.0,
      ),
    ]
    |> array.from_list

  assert staff_list_filter.filter_staff_users(users, "  MARIA\t555  ")
    |> array.to_list
    == ["target-user-id"]
}

pub fn sorts_equal_timestamps_by_subject_test() {
  let users =
    [
      staff_user("zoe", True, False, "", "Zoe", "", 1.0),
      staff_user("anna", True, False, "", "Anna", "", 1.0),
    ]
    |> array.from_list

  assert staff_list_filter.filter_staff_users(users, "")
    |> array.to_list
    == ["anna", "zoe"]
}

fn staff_user(
  subject: String,
  has_admin_claim: Bool,
  has_staff_claim: Bool,
  email: String,
  name: String,
  phone: String,
  updated_at: Float,
) -> staff_list_filter.SearchableStaffUser(String) {
  staff_list_filter.SearchableStaffUser(
    source: subject,
    has_admin_claim: has_admin_claim,
    has_staff_claim: has_staff_claim,
    email: email,
    name: name,
    nickname: "",
    phone: phone,
    preferred_username: "",
    subject: subject,
    token_identifier: "firebase|" <> subject,
    updated_at: updated_at,
  )
}
