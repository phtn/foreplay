# What makes a JS/TS file a good Gleam port candidate

Gleam is a statically-typed functional language (sound type system, no `null`,
no exceptions for control flow, pattern matching via `case`, immutable data)
that compiles to JS (or Erlang/BEAM). It shines for the same reasons ML-family
languages always do: logic-heavy, data-transforming, type-shaped code. It is
a poor fit for code whose job is to talk to a messy, dynamic, mutable outside
world.

Use this as the "why" behind the scanner's score, and as your own checklist
when reading a candidate file by eye (the scanner is a heuristic first pass —
always sanity-check the top few candidates yourself).

## Strong fit — look for these

- **Discriminated unions + switch/case on a tag field.** This is the single
  strongest signal. JS code that does `switch (shape.type) { case "circle": ... }`
  over a `{ type: "circle" | "rect", ... }` union is *already* thinking in
  Gleam's native idiom: custom types + `case` expressions. The port is often
  close to mechanical.
- **Pure data transformation.** Functions that take data in and return data
  out, with no side effects — parsers, validators, formatters, calculators,
  reducers, state-machine transition functions, business-rule engines.
- **Functional pipelines.** Heavy `.map/.filter/.reduce/.flatMap` chains map
  almost 1:1 to Gleam's `list.map`, `list.filter`, `list.fold`, piped with `|>`.
- **Already-typed code.** Files with lots of `interface`/`type` declarations
  mean the author has already done the hard part (modeling the domain);
  translating those shapes into Gleam's `type` definitions is mechanical.
- **Little to no mutation.** `const`-only code with no reassignment, no
  `.push`/`.splice`, no mutated objects, translates cleanly since Gleam values
  are immutable by default.
- **Small, self-contained dependency surface.** Files that import few (or no)
  third-party packages are easy to port because there's nothing to find a
  Gleam/FFI equivalent for.
- **Result/Option-shaped error handling.** Code that already returns
  `{ ok: true, value }` / `{ ok: false, error }`-style objects instead of
  throwing exceptions maps directly onto Gleam's `Result(a, b)` and `Option(a)`.

## Poor fit — treat as reasons to deprioritize or disqualify

- **JSX / component rendering.** React (or similar) component files are
  fundamentally about DOM rendering and framework lifecycle, not data
  transformation. Gleam has UI frameworks (e.g. Lustre) but porting a
  component is a much bigger, different project than porting a utility
  module — don't recommend it via this scanner.
- **Heavy DOM/browser API usage.** `document.*`, `window.*`, `localStorage`,
  event listeners — this is imperative interaction with a stateful host
  environment, which Gleam doesn't remove, it just relocates behind FFI. Low
  value to port in isolation.
- **OOP with inheritance/mixins/decorators.** Gleam has no classes or
  inheritance. A `class Dog extends Animal` hierarchy needs a real redesign
  (typically into a variant type + functions), not a mechanical port.
- **Lots of mutation (`let` reassignment, in-place array/object mutation).**
  Each mutation site is a decision point in the port (make a new value
  instead), which multiplies effort.
- **Large third-party dependency surface.** Every npm import is either (a)
  something with no Gleam equivalent, requiring FFI/JS-interop glue, or (b)
  something to find/write bindings for. Files that are mostly "glue code"
  around several libraries rarely benefit from a port.
- **Dynamic metaprogramming** (`eval`, `new Function`, `Proxy`, `Reflect`,
  prototype hacking). Fundamentally incompatible with a statically-typed
  language; these files should never be recommended.
- **Node-native / I/O-heavy code** (`fs`, `net`, `child_process`, raw
  `process`). Not impossible (Gleam can FFI to Node), but the win is smaller
  since the file is mostly orchestration/I/O rather than logic.

## A useful mental test

Ask: **"If I deleted the types and just looked at what this file *does*, is
it computing something, or is it talking to something?"**

- Computing (parsing, validating, transforming, calculating, routing on a
  tag) → good Gleam candidate.
- Talking (to the DOM, to a database, to the filesystem, to a UI framework's
  lifecycle) → keep it in JS/TS, maybe call into a Gleam module for its
  actual logic via a clean function boundary.

## Reviewing top candidates (when explaining results to the user)

For each top-ranked file, explain in plain language:
1. What the file does (one sentence).
2. Which specific signals from the scanner justify the score (cite them,
   don't just repeat the number).
3. Any risk/friction the scanner *wouldn't* catch — e.g. a subtle mutation
   pattern, a tricky generic type, an implicit dependency on JS's `NaN`/`==`
   coercion quirks, a function that's pure-looking but throws.
4. A one-line verdict: "good first module to port" / "portable but only
   worth it if X is also being ported" / etc.
