import gleam/float
import gleam/javascript/array.{type Array}
import gleam/list
import gleam/order.{type Order, Eq, Gt, Lt}
import gleam/string

pub type SearchableStaffUser(a) {
  SearchableStaffUser(
    source: a,
    has_admin_claim: Bool,
    has_staff_claim: Bool,
    email: String,
    name: String,
    nickname: String,
    phone: String,
    preferred_username: String,
    subject: String,
    token_identifier: String,
    updated_at: Float,
  )
}

@external(javascript, "./staff_list_filter_ffi.mjs", "normalizeSearchValue")
fn normalize_search_value(value: String) -> String

@external(javascript, "./staff_list_filter_ffi.mjs", "compareSubjects")
fn compare_subjects(left: String, right: String) -> Int

pub fn has_staff_or_admin_claim(
  has_admin_claim: Bool,
  has_staff_claim: Bool,
) -> Bool {
  has_admin_claim || has_staff_claim
}

pub fn filter_staff_users(
  users: Array(SearchableStaffUser(a)),
  query: String,
) -> Array(a) {
  let search_terms =
    query
    |> normalize_search_value
    |> string.split(" ")
    |> list.filter(fn(term) { term != "" })

  users
  |> array.to_list
  |> list.filter(fn(user) { should_include_user(user, search_terms) })
  |> list.sort(by: compare_staff_users)
  |> list.map(fn(user) { user.source })
  |> array.from_list
}

fn should_include_user(
  user: SearchableStaffUser(a),
  search_terms: List(String),
) -> Bool {
  case search_terms {
    [] -> has_staff_or_admin_claim(user.has_admin_claim, user.has_staff_claim)
    _ -> {
      let search_text = user_search_text(user)
      list.all(search_terms, fn(term) { string.contains(search_text, term) })
    }
  }
}

fn user_search_text(user: SearchableStaffUser(a)) -> String {
  [
    user.email,
    user.name,
    user.nickname,
    user.phone,
    user.preferred_username,
    user.subject,
    user.token_identifier,
  ]
  |> list.filter(fn(value) { value != "" })
  |> string.join(" ")
  |> normalize_search_value
}

fn compare_staff_users(
  left: SearchableStaffUser(a),
  right: SearchableStaffUser(a),
) -> Order {
  case float.compare(right.updated_at, left.updated_at) {
    Eq -> compare_subjects(left.subject, right.subject) |> comparison_to_order
    order -> order
  }
}

fn comparison_to_order(comparison: Int) -> Order {
  case comparison {
    value if value < 0 -> Lt
    0 -> Eq
    _ -> Gt
  }
}
