import gleam/int
import gleam/list
import gleam/string

const sponsor_driven_event_label = "Sponsor-driven event"

const not_configured_label = "Not configured"

pub fn registration_fee_label(value: Float, formatted_value: String) -> String {
  case value <=. 0.0 {
    True -> sponsor_driven_event_label
    False -> formatted_value
  }
}

pub fn slots_label(
  registered_slots: Int,
  has_slots_limit: Bool,
  slots_limit: Int,
) -> String {
  let registered_label = int.to_string(registered_slots)

  case has_slots_limit {
    True -> registered_label <> "/" <> int.to_string(slots_limit)
    False -> registered_label
  }
}

pub fn publication_label(is_published: Bool) -> String {
  case is_published {
    True -> "Published"
    False -> "Draft"
  }
}

pub fn commission_label(
  commission_type: String,
  has_value: Bool,
  value_label: String,
) -> String {
  case has_value {
    True -> commission_type <> " · " <> value_label
    False -> not_configured_label
  }
}

pub fn status_label(status: String) -> String {
  status
  |> string.split("_")
  |> list.map(capitalise_first)
  |> string.join(" ")
}

fn capitalise_first(value: String) -> String {
  case string.first(value) {
    Ok(first) -> string.uppercase(first) <> string.drop_start(value, 1)
    Error(_) -> ""
  }
}
