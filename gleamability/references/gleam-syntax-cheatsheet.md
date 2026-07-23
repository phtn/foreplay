# JS/TS → Gleam quick reference

Use this when sketching a Gleam port of a candidate file. This is not
exhaustive — check https://gleam.run and https://gleam.run/documentation
for anything unusual (Claude should web-search current Gleam docs/stdlib
signatures rather than rely on memory, since Gleam's stdlib API can shift
between versions).

## Functions

```ts
// TS
export function area(shape: Shape): number { ... }
```
```gleam
// Gleam
pub fn area(shape: Shape) -> Float { ... }
```
No default params, no overloads, no `this`. Labeled arguments exist for
readability: `pub fn area(shape s: Shape) -> Float`.

## Types / discriminated unions

```ts
type Shape =
  | { type: "circle"; radius: number }
  | { type: "rect"; width: number; height: number };
```
```gleam
pub type Shape {
  Circle(radius: Float)
  Rect(width: Float, height: Float)
}
```
Gleam custom types *are* the tag — no separate `type` field needed.

## Pattern matching (switch → case)

```ts
switch (shape.type) {
  case "circle": return Math.PI * shape.radius ** 2.0;
  case "rect":   return shape.width * shape.height;
}
```
```gleam
case shape {
  Circle(radius: r) -> 3.14159 *. r *. r
  Rect(width: w, height: h) -> w *. h
}
```
`case` must be exhaustive — the compiler enforces every variant is handled
(no fallthrough bugs). Note Gleam uses `+.`, `-.`, `*.`, `/.` for Float math
and `+`, `-`, `*`, `/` for Int — there's no implicit numeric coercion.

## Lists / arrays

```ts
items.map(f)
items.filter(p)
items.reduce((acc, x) => ..., init)
items.flatMap(f)
[...items, x]
```
```gleam
list.map(items, f)
list.filter(items, p)
list.fold(items, init, fn(acc, x) { ... })
list.flat_map(items, f)
[x, ..items]   // prepend; Gleam lists are singly-linked
```
`import gleam/list`. Piping is idiomatic:
```gleam
items
|> list.filter(p)
|> list.map(f)
```

## Option / Result instead of null / undefined / throw

```ts
function find(items: Item[], id: string): Item | null { ... }
function parse(input: string): { ok: true, value: number } | { ok: false, error: string } { ... }
```
```gleam
pub fn find(items: List(Item), id: String) -> Option(Item) { ... }
pub fn parse(input: String) -> Result(Float, String) { ... }
```
`import gleam/option.{type Option, Some, None}`. `Result(a, e)` is built in
(`Ok(a)` / `Error(e)`). No exceptions for expected failure paths.

## Records (object literals with fixed shape)

```ts
interface User { id: string; name: string; age: number }
const u = { id: "1", name: "Ada", age: 30 };
const older = { ...u, age: u.age + 1 };
```
```gleam
pub type User {
  User(id: String, name: String, age: Int)
}
let u = User(id: "1", name: "Ada", age: 30)
let older = User(..u, age: u.age + 1)
```

## Strings, string interpolation

```ts
`Hello ${name}, you are ${age}`
```
```gleam
"Hello " <> name <> ", you are " <> int.to_string(age)
```
No native interpolation — string concatenation via `<>`, explicit
`int.to_string` / `float.to_string` conversions (`import gleam/int`,
`import gleam/float`).

## Immutability

Everything in Gleam is immutable — there is no `let` reassignment
equivalent. "Mutating" state means building a new value and (usually)
returning it or rebinding a new `let` name in the same scope. If the source
file relies on iterative mutation (`let x = ...; x = f(x)` in a loop), the
Gleam version becomes a `list.fold` or recursive function instead.

## Calling into existing JS (FFI)

If a small slice of a ported module still needs a real JS API (e.g. `Date`,
`crypto`), Gleam supports external functions:
```gleam
@external(javascript, "./my_ffi.mjs", "now")
pub fn now() -> Int
```
Flag this explicitly in the sketch rather than pretending the whole file
has zero JS dependencies if it doesn't.

## What NOT to attempt a 1:1 sketch of

Classes with inheritance, JSX components, and heavily dynamic code (the
scanner's disqualifiers) don't have a clean mechanical translation — for
those, note that a port would require a redesign, not just a syntax sketch,
and briefly describe what that redesign would look like instead of writing
literal Gleam code.
