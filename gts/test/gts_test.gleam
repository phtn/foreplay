import formatters
import gleeunit
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
