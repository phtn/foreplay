# Gleamability report

Date: 2026-07-27  
Scope: `/Users/xpriori/Code/foreplay`  
Scanner: `.agents/skills/gleamability/scripts/analyze.js`

## Conclusion

Yes. The best next port is the pure codec core of
`components/table/parsers.ts`.

The scanner incorrectly marked that file `Not a fit` with a score of 54. Its
prototype-hacking rule matched the defensive string literal `"__proto__"` in
the unsafe-key denylist; the file does not modify prototypes. Manual review
reverses that verdict to **strong candidate**.

This candidate has substantially more leverage than the scanner's nominal
leader, `components/table/visibility.ts`:

- It is deterministic input-to-output logic rather than framework
  orchestration.
- It already has six focused round-trip and bounds tests.
- Its states map naturally to Gleam custom types, lists, sets, dictionaries,
  exhaustive `case` expressions, and immutable folds.
- It parses untrusted query-string state. Gleam would remove several classes
  of accidental mutation and invalid intermediate state.
- The repository already has a working Gleam 1.17 JavaScript target, build
  scripts, TypeScript declarations, and an established thin-adapter pattern.

Do not port the `nuqs` or TanStack integration. Keep a small TypeScript adapter
that converts TanStack's object shapes to and from a new
`gts/src/table_query.gleam` core.

## Scan summary

The deterministic pass scanned 261 JavaScript/TypeScript files:

| Scanner tier | Files |
|---|---:|
| Strong candidate | 0 |
| Possible candidate | 66 |
| Low priority | 9 |
| Not a fit | 186 |

The scanner automatically excluded `node_modules`, generated/build output,
`.next`, declarations, and the entire `convex/` directory. Its score is a
useful prior, not a parser-backed verdict.

Two high-ranked results are not new opportunities:

- `app/tournaments/[tourId]/entry/prepare-subscription.ts` already adapts
  `gts/tournament_entry.mjs`.
- `utils/formatters.ts` already delegates its pure label rules to
  `gts/formatters.mjs`; the remaining date/currency work is intentionally an
  `Intl` host boundary.

## Corrected shortlist

| Manual rank | File/scope | Raw result | Manual verdict | Reason |
|---:|---|---|---|---|
| 1 | `components/table/parsers.ts` pure codecs | 54, Not a fit | **Strong** | Pure, bounded, test-covered parse/serialize rules; the disqualifier is a false positive caused by `"__proto__"` data. |
| 2 | `lib/admin/crypto-wallet-settings.ts` | 56, Possible | Good, higher-risk | Pure typed normalization with no imports, but it accepts arbitrary JS objects and is consumed by Convex, adding dynamic-decoding and deployment-boundary work. |
| 3 | `lib/tones/index.ts` lines 1–147 | 56, Possible | Good split candidate | Config normalization is pure and typed; `playAdminAlert` must remain TypeScript because it is Tone.js/browser orchestration. |
| 4 | `components/table/visibility.ts` | 66, Possible | Easy, low leverage | Small immutable reducers and equality logic, but most behavior is trivial and coupled to TanStack callback/object shapes. |

## Best candidate: table query codecs

### What it does

The module bounds, parses, validates, and serializes URL state for pagination,
search, sorting, column filters, column visibility, row selection, and row
pinning.

### Why it fits Gleam

- The parse/serialize pairs are pure functions.
- `asc | desc` is already an implicit sum type.
- Filter, selection, visibility, and pinning states are data transformations.
- Deduplication and bounded accumulation become immutable `Set`/`Dict` folds.
- Invalid inputs already collapse to safe defaults, which maps cleanly to
  `Result`, `Option`, and exhaustive pattern matching.
- The existing tests specify compatibility at the correct boundary.

### Friction the scanner could not model

- The current code uses `encodeURIComponent` and `decodeURIComponent`.
  `gleam/uri.percent_encode` may not produce byte-for-byte identical output for
  every character. Production work should either retain a tiny JS FFI for
  exact compatibility or add explicit compatibility tests before changing the
  encoding.
- `clampInteger` deliberately uses JavaScript's `Number(...)`, `Math.floor`,
  and finite-number semantics. Port it only after deciding whether exact JS
  coercion is part of the contract. Starting with sorting, filters, selection,
  and pinning avoids that decision.
- TanStack expects plain JS objects and `nuqs` parser objects. A TypeScript
  adapter should continue to construct those shapes.
- Gleam strings count graphemes while JavaScript `slice` counts UTF-16 code
  units. The current limits are defensive bounds, but exact behavior for
  non-BMP text should be locked down with parity tests.

### Recommended extraction boundary

Move these rules into `gts/src/table_query.gleam`:

- bounds/constants used by the codecs;
- safe key validation;
- bounded token decoding and encoding;
- sorting parse/serialize;
- column-filter parse/serialize;
- visibility parse/serialize;
- row-selection and row-pinning parse/serialize.

Keep these in `components/table/parsers.ts`:

- TanStack type imports;
- `nuqs` parser-object construction and `selectModeParser`;
- conversion between generated Gleam values and TanStack's plain object
  states;
- any compatibility FFI needed for JavaScript URL encoding or number coercion.

An incremental first slice should port sorting plus row selection/pinning,
run the existing TypeScript parity tests against both implementations, then
move filters and visibility.

## Validated Gleam sketch

This is a feasibility sketch, not a production-ready module. It was formatted
and accepted by the repository's pinned Gleam 1.17.0 compiler. It demonstrates
the main types, immutable filter fold, bounds, and parse/serialize shape.

```gleam
import gleam/list
import gleam/set.{type Set}
import gleam/string
import gleam/uri

const token_characters = 512

const serialized_state_characters = 16_384

const column_filter_limit = 64

const filter_values_per_column = 256

pub type SortDirection {
  Asc
  Desc
}

pub opaque type Sort {
  Sort(id: String, direction: SortDirection)
}

pub opaque type ColumnFilter {
  ColumnFilter(id: String, values: List(String))
}

pub fn parse_sorting(value: String) -> List(Sort) {
  case
    value
    |> trim_state_value
    |> string.split(on: ":")
  {
    [raw_id, "asc"] -> sorting_if_safe(raw_id, Asc)
    [raw_id, "desc"] -> sorting_if_safe(raw_id, Desc)
    _ -> []
  }
}

pub fn serialize_sorting(sorts: List(Sort)) -> String {
  case sorts {
    [Sort(id: id, direction: direction), ..] ->
      case is_safe_object_key(id) {
        True -> encode_token(id) <> ":" <> direction_label(direction)
        False -> ""
      }
    _ -> ""
  }
}

pub fn parse_column_filters(value: String) -> List(ColumnFilter) {
  let #(_, filters) =
    value
    |> trim_state_value
    |> string.split(on: "|")
    |> list.take(up_to: column_filter_limit)
    |> list.fold(from: #(set.new(), []), with: parse_column_filter_group)

  list.reverse(filters)
}

pub fn serialize_column_filters(filters: List(ColumnFilter)) -> String {
  filters
  |> list.filter(fn(filter) { is_safe_object_key(filter.id) })
  |> list.take(up_to: column_filter_limit)
  |> list.map(fn(filter) {
    let values =
      filter.values
      |> list.take(up_to: filter_values_per_column)
      |> list.map(encode_token)
      |> string.join(with: ",")

    encode_token(filter.id) <> ":" <> values
  })
  |> string.join(with: "|")
  |> string.slice(at_index: 0, length: serialized_state_characters)
}

pub fn sort_id(sort: Sort) -> String {
  sort.id
}

pub fn sort_is_desc(sort: Sort) -> Bool {
  sort.direction == Desc
}

pub fn column_filter_id(filter: ColumnFilter) -> String {
  filter.id
}

pub fn column_filter_values(filter: ColumnFilter) -> List(String) {
  filter.values
}

fn parse_column_filter_group(
  state: #(Set(String), List(ColumnFilter)),
  group: String,
) -> #(Set(String), List(ColumnFilter)) {
  let #(seen, filters) = state
  let #(raw_id, raw_values) = case string.split_once(group, on: ":") {
    Ok(parts) -> parts
    Error(_) -> #(group, "")
  }
  let id = decode_token(raw_id)

  case is_safe_object_key(id) && !set.contains(seen, id) {
    False -> state
    True -> {
      let values = case raw_values {
        "" -> []
        raw ->
          raw
          |> string.split(on: ",")
          |> list.map(decode_token)
          |> list.filter(fn(value) { value != "" })
          |> list.unique
          |> list.take(up_to: filter_values_per_column)
      }

      #(set.insert(seen, id), [ColumnFilter(id: id, values: values), ..filters])
    }
  }
}

fn sorting_if_safe(raw_id: String, direction: SortDirection) -> List(Sort) {
  let id = decode_token(raw_id)
  case is_safe_object_key(id) {
    True -> [Sort(id: id, direction: direction)]
    False -> []
  }
}

fn direction_label(direction: SortDirection) -> String {
  case direction {
    Asc -> "asc"
    Desc -> "desc"
  }
}

fn trim_state_value(value: String) -> String {
  string.slice(value, at_index: 0, length: serialized_state_characters)
}

fn decode_token(value: String) -> String {
  let bounded = string.slice(value, at_index: 0, length: token_characters * 3)

  case uri.percent_decode(bounded) {
    Ok(decoded) -> string.slice(decoded, at_index: 0, length: token_characters)
    Error(_) -> string.slice(bounded, at_index: 0, length: token_characters)
  }
}

fn encode_token(value: String) -> String {
  value
  |> string.slice(at_index: 0, length: token_characters)
  |> uri.percent_encode
}

fn is_safe_object_key(value: String) -> Bool {
  value != ""
  && value != "__proto__"
  && value != "constructor"
  && value != "prototype"
}
```

For production, add Gleam tests for all current TypeScript fixtures plus
cross-language parity tests that compare serialized strings.

## Manual review of the scanner leaders

| Raw rank | File | Score | Review |
|---:|---|---:|---|
| 1 | `components/table/visibility.ts` | 66 | Portable, but the reducer/equality logic is too small to justify the interop boundary as the next port. |
| 2 | `app/tournaments/[tourId]/entry/actions.ts` | 61 | False positive: auth, Convex mutations, QR generation, logging, and exception handling make this host orchestration. Keep it TypeScript. |
| 3 | `app/tournaments/[tourId]/entry/prepare-subscription.ts` | 60 | Already ported; this is the intended TypeScript adapter over `gts/tournament_entry.mjs`. |
| 5 | `utils/formatters.ts` | 57 | Already partially ported. Keep the remaining `Intl` date/currency work at the JS boundary. |
| 6 | `app/admin/[eventId]/subscription-status-actions.ts` | 56 | Constants and TypeScript types only; no meaningful runtime logic to port. |
| 10 | `lib/admin/crypto-wallet-settings.ts` | 56 | Real candidate, but arbitrary-object decoding and Convex consumption make it a riskier second port. |
| 11 | `lib/tones/index.ts` | 56 | Port only config normalization; keep Tone.js playback and timers in TypeScript. |
| 14 | `components/table/filter-fns.ts` | 55 | Useful algorithms, but TanStack `Row`, `WeakMap` caching, mutation, and `Object.assign` make the current module a poor first boundary. |
| 19 | `components/table/parsers.ts` | 54 | Scanner false positive; manually promoted to the best candidate. |

## Full raw ranking above Low priority

The reason column is the strongest scanner signal plus the most important
manual caveat where one was evident. These rows are not all recommendations.

| Rank | Score | File | One-line reason |
|---:|---:|---|---|
| 1 | 66 | `components/table/visibility.ts` | Immutable reducers and equality helpers; easy but low leverage and TanStack-shaped. |
| 2 | 61 | `app/tournaments/[tourId]/entry/actions.ts` | Result-shaped returns, but the file is auth/database/server orchestration. |
| 3 | 60 | `app/tournaments/[tourId]/entry/prepare-subscription.ts` | Result-shaped pure adapter; its core is already Gleam. |
| 4 | 57 | `utils/formatters.ts` | Pure-looking functions; label logic is already Gleam and the rest uses `Intl`. |
| 5 | 56 | `app/admin/[eventId]/subscription-status-actions.ts` | Typed constants only, with almost no runtime logic. |
| 6 | 56 | `app/tournaments/[tourId]/entry/prepare-subscription.test.ts` | Tests Result-shaped behavior that is already backed by Gleam. |
| 7 | 56 | `lib/admin/crypto-wallet-settings.ts` | Import-free, immutable, typed normalization; good but dynamic/Convex-facing. |
| 8 | 56 | `lib/tones/index.ts` | Pure config pipelines share a file with effectful Tone.js playback. |
| 9 | 55 | `app/admin/[eventId]/actions.ts` | Result-shaped returns, but mostly server I/O and external services. |
| 10 | 55 | `components/table/filter-fns.ts` | Functional matching pipelines, offset by TanStack and mutable caches. |
| 11 | 55 | `components/table/safe-navigation.ts` | Pure-looking URL validation, but depends heavily on JavaScript URL APIs. |
| 12 | 55 | `lib/constants.ts` | Typed static maps rather than substantial logic. |
| 13 | 55 | `lib/routing/auth-redirect.ts` | Small deterministic helper, but mostly a wrapper over `URL`/`URLSearchParams`. |
| 14 | 54 | `components/qrcode/create-svg.ts` | Thin constructor wrapper around an npm QR library. |
| 15 | 54 | `lib/firebase/auth-state.ts` | Typed state helpers, but coupled to Firebase host values. |
| 16 | 54 | `lib/firebase/session.ts` | Typed helpers with Firebase/session integration friction. |
| 17 | 54 | `public/workers/image-converter.worker.ts` | Typed worker logic, but browser APIs define the boundary. |
| 18 | 53 | `app/api/auth/session/route.ts` | Result-shaped route logic dominated by server I/O. |
| 19 | 53 | `app/auth/_components/auth-error-message.tsx` | Type-shaped helper with little standalone domain logic. |
| 20 | 53 | `components/loaders/px-grid.tsx` | Type-heavy UI-adjacent code rather than a clean computation module. |
| 21 | 53 | `components/table/filter-utils.ts` | Rich pipelines, but arbitrary JS values, cycles, mutation, and TanStack coupling add friction. |
| 22 | 53 | `lib/cmc/types.ts` | Domain declarations only; no computation to gain from porting. |
| 23 | 53 | `lib/tickets/registration-ticket.ts` | Typed ticket logic with an external-package boundary. |
| 24 | 52 | `app/admin/config/actions.ts` | Type-rich code, but primarily server action orchestration. |
| 25 | 52 | `app/api/auth/admin-handoff/route.ts` | Result-shaped route with Node/server dependencies. |
| 26 | 52 | `app/subscriptions/types.ts` | Type declarations only. |
| 27 | 52 | `components/landing/types.ts` | Type declarations only. |
| 28 | 52 | `components/table/custom-maps.ts` | Small pure helpers, but too little logic for a useful boundary. |
| 29 | 52 | `components/table/title.tsx` | Pure-looking title helper, still UI-adjacent and small. |
| 30 | 52 | `lib/firebase/custom-claims.ts` | Functional transformations, but directly coupled to Firebase claim shapes. |
| 31 | 52 | `lib/formatters/dt.ts` | Small formatter helpers dominated by JavaScript date/`Intl` APIs. |
| 32 | 52 | `lib/routing/admin-subdomain.ts` | Typed routing logic coupled to environment/process state. |
| 33 | 50 | `app/admin/config/_contents/settings.tsx` | No strong positive scanner signal; UI-adjacent. |
| 34 | 50 | `app/api/quotes/route.ts` | Array pipelines, but route I/O and mutation dominate. |
| 35 | 50 | `app/auth/types.ts` | Types only. |
| 36 | 50 | `components/landing/game-row.tsx` | No meaningful pure-module signal. |
| 37 | 50 | `components/layouts/index.ts` | Barrel module, not a port target. |
| 38 | 50 | `components/reui/badge.tsx` | Typed UI code, not a standalone computation module. |
| 39 | 50 | `components/table/visibility.test.ts` | Tests the higher-ranked visibility helper; tests are not the port boundary. |
| 40 | 50 | `components/theme/index.ts` | Barrel/static module with no meaningful domain logic. |
| 41 | 50 | `lib/firebase/admin.ts` | Firebase boundary module. |
| 42 | 50 | `lib/icons/icons.ts` | Typed static icon data. |
| 43 | 50 | `lib/icons/logos.ts` | Typed static logo data. |
| 44 | 50 | `lib/tickets/download-ticket-png.ts` | Functional pieces are dominated by DOM/browser rendering APIs. |
| 45 | 50 | `proxy.ts` | Thin Next.js/framework boundary. |
| 46 | 50 | `public/pinatubo-complete.ts` | Mostly static/generated-looking data rather than domain computation. |
| 47 | 49 | `lib/utils.ts` | Small typed utility around external class-name packages. |
| 48 | 49 | `next.config.ts` | Framework configuration, not runtime domain logic. |
| 49 | 49 | `utils/formatters.test.ts` | Tests formatter behavior; the relevant pure core is already Gleam. |
| 50 | 48 | `app/api/auth/admin-client-token/route.ts` | Server route and external-service boundary. |
| 51 | 48 | `app/auth/page.tsx` | No strong pure-module signal. |
| 52 | 48 | `components/form/ctx.ts` | Framework/context plumbing. |
| 53 | 48 | `components/form/index.ts` | Barrel module. |
| 54 | 48 | `components/table/filter-fns.test.ts` | Tests a TanStack/mutable-cache integration module. |
| 55 | 48 | `lib/firebase/admin-core.ts` | Typed but Node/Firebase-oriented initialization code. |
| 56 | 48 | `tests/registration-ticket.test.ts` | Test file, not a production port boundary. |
| 57 | 48 | `tests/ticket-png.test.ts` | Test file for browser/document rendering behavior. |
| 58 | 48 | `utils/generators.ts` | Pure-looking helpers offset by reassignment/random-host semantics. |
| 59 | 48 | `utils/image-compress.ts` | Browser canvas/image work with mutable control flow. |
| 60 | 47 | `app/subscriptions/[subscriptionId]/registration-actions.ts` | Typed action logic dominated by server I/O. |
| 61 | 47 | `components/table/safe-navigation.test.ts` | Test file for a JavaScript URL boundary. |
| 62 | 47 | `lib/firebase/server-session.ts` | Pure-looking helpers coupled to Firebase session objects. |
| 63 | 47 | `lib/routing/auth-redirect.test.ts` | Test file for JavaScript URL helpers. |
| 64 | 46 | `lib/tones/index.test.ts` | Tests both a possible pure config slice and effectful Tone.js playback. |
| 65 | 46 | `tests/subscription-entry-policy.test.ts` | Test file, not a production module. |
| 66 | 46 | `tests/ticket-png.browser.test.ts` | Browser test with DOM and mutation dependencies. |

## Verification performed

- Scanner completed over 261 files and wrote its full JSON report to a
  temporary path.
- `bun test components/table/parsers.test.ts`: 6 passed, 0 failed.
- `bun run test:gts`: 11 passed, 0 failed.
- The representative `table_query` sketch passed `gleam check` under Gleam
  1.17.0, then the temporary validation module was removed.

No production implementation was changed by this analysis.
