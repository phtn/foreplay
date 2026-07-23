# Security best-practices report

Date: 2026-07-23

Scope: focused review of `components/table/` plus a repository dependency
audit. This is a code review, not a penetration test.

## Executive summary

Four table-level issues were addressed:

1. unbounded/unescaped URL-controlled table state;
2. unsafe dynamic internal navigation;
3. default-on bulk field mutation;
4. domain-coupled mutation cells with an invalid React calling convention.

No `dangerouslySetInnerHTML`, raw DOM HTML assignment, `eval`, or equivalent
code-execution sink was found in the table scope.

The remaining material risk is outside the table implementation:
`bun audit --json` reports 33 dependency advisories—1 critical, 13 high,
18 moderate, and 1 low. No dependency versions were changed as part of this
component-scoped refactor. The direct Next.js dependency and the critical
Firebase transitive chain should be remediated in a dedicated dependency
upgrade with application regression testing.

## Findings

### TABLE-SEC-001 — URL-controlled resource amplification and unsafe keys

Severity: Medium  
Status: Fixed

Affected code before refactor: table pagination, filters, visibility,
selection, and pinning parsers.

Evidence:

- limits are centralized at `components/table/parsers.ts:10`;
- unsafe object-property names are rejected at
  `components/table/parsers.ts:23`;
- page size is clamped to 500 at `components/table/parsers.ts:76`;
- serialized state, filter values, selected IDs, and pinned IDs are encoded
  and bounded throughout `components/table/parsers.ts:124-298`;
- adversarial cases are covered by
  `components/table/parsers.test.ts`.

Impact:

A crafted URL could previously request excessive client rendering, create
very large filter/selection state, and place attacker-controlled names into
object-shaped state. The primary consequence is client-side denial of service
or state corruption after a victim opens a crafted link.

Fix:

All numeric, string, collection, and serialized-state sizes are bounded.
Delimiter-bearing tokens use URI encoding, duplicate values are collapsed,
and prototype-significant names are rejected wherever tokens become object
keys.

Mitigation/verification:

`npm run test:table` covers clamping, encoded round trips, prototype-key
rejection, visibility defaults, selection, and pinning.

False-positive considerations:

This was a client-side availability/state-integrity issue, not evidence of
server compromise. Backend query/mutation validators remain mandatory because
client bounds are bypassable.

### TABLE-SEC-002 — Dynamic navigation accepted unsafe destinations

Severity: Medium  
Status: Fixed

Affected code before refactor: `linkText` and `createUserCell` in
`components/table/cells.tsx`.

Evidence:

- internal destination validation is implemented at
  `components/table/safe-navigation.ts:3`;
- row values are appended as encoded path segments at
  `components/table/safe-navigation.ts:22`;
- `linkText` uses the validated result at
  `components/table/cells.tsx:207`;
- user-cell destinations are validated at
  `components/table/cells.tsx:761`.

Impact:

If route builders consumed untrusted row data, a protocol-relative, external,
backslash-confused, or non-HTTP scheme could reach a navigation component.
That can enable phishing/open-redirect behavior and, depending on framework
handling, unsafe scheme navigation.

Fix:

Navigation helpers now accept same-origin paths beginning with exactly one
slash. Backslashes and external origins are rejected. Dynamic row values are
one encoded path segment. Invalid destinations render as non-clickable text.

Mitigation/verification:

Keep route builders deterministic and based on validated IDs. If external
links become a requirement, introduce a separate external-link component with
an explicit protocol/host allow-list and safe `rel` behavior.

False-positive considerations:

The prior helper may only have received hard-coded paths in practice; there
are no current repository callers. The unsafe capability nevertheless existed
in a reusable component API.

### TABLE-SEC-003 — Bulk editor exposed primitive fields by default

Severity: Medium  
Status: Fixed in UI; backend validation still required

Affected code before refactor: `components/table/multi-select.tsx`.

Evidence:

- fields now require explicit opt-in at
  `components/table/multi-select.tsx:71`;
- option materialization is bounded at
  `components/table/multi-select.tsx:50` and
  `components/table/multi-select.tsx:610`;
- numeric inputs must be finite before submission;
- the security contract is documented in
  `components/table/README.md`.

Impact:

Default-on editing made newly added primitive columns silently mutable through
the bulk UI. If a parent forwarded `updates` as a database patch, this could
become a mass-assignment path for role, ownership, lifecycle, or other
server-managed fields.

Fix:

Only columns with `meta.bulkEditor: true` or an explicit configuration are
presented. Identifiers remain excluded. Invalid numeric values are blocked and
select option counts are bounded.

Mitigation:

The backend must construct its own validated patch. Never spread the client
`updates` object directly into a record. Authenticate the actor, authorize
every target ID, allow-list keys, validate values, and cap batch size.

False-positive considerations:

No current in-repository caller was found, so no exploitable backend path was
confirmed. UI opt-in is defense in depth, not an authorization control.

### TABLE-SEC-004 — Generic cells hid an invalid database mutation boundary

Severity: Medium  
Status: Fixed in component; server authorization is a consumer obligation

Affected code before refactor: `editableStatusCell`, `toggleCell`, and
`editableCell` in `components/table/cells.tsx`.

Evidence:

The old components imported Convex order/user types and, in two cases,
declared a mutation as a second React component argument. React does not pass
that argument, making persistence behavior invalid and encouraging
schema-specific mutation logic inside presentation code.

Fix:

The factories now take explicit typed persistence callbacks:

- `CellCommitHandler<T, Value>`;
- `editableStatusCell(prop, onChange, options)`;
- `toggleCell(prop, onChange, config)`;
- `editableCell(prop, onSave, options)`.

They expose pending/error state without assuming record IDs, table names,
mutation functions, or argument shapes.

Mitigation:

Callbacks should call a server/Convex mutation that uses runtime argument
validators, obtains the authenticated identity server-side, authorizes the
specific record, and writes a backend-owned allow-list of fields. Client
`hidden`, `disabled`, and action visibility checks are not security controls.

False-positive considerations:

This was primarily an architectural correctness flaw. It becomes a security
issue only if consumers compensate with broad or under-validated mutations.

### DEP-001 — Direct Next.js dependency has known high-severity advisories

Severity: High  
Status: Open

Evidence:

- `package.json:38` pins `next` to `16.2.7`;
- `package.json:56` pins `eslint-config-next` to `16.2.7`;
- the 2026-07-23 Bun audit reports nine Next.js advisories affecting
  `>=16.0.0 <16.2.11`: four high and five moderate.

Reported high-severity classes include proxy authorization bypass, SSRF, and
server-action denial of service.

Impact:

Exposure depends on deployment mode and used Next.js features, but the
application uses the App Router, Proxy/Middleware, APIs, and server-rendered
routes, so the dependency should not be treated as unreachable by default.

Recommended fix:

Upgrade `next` and `eslint-config-next` together to at least `16.2.11` (or a
newer compatible patched release), then run the full build and authentication,
proxy, image, rewrite, API, and server-action integration tests.

Mitigation until upgraded:

Restrict untrusted rewrite destinations and server-action payload sizes at the
edge where possible. Do not rely on these mitigations as substitutes for the
vendor patch.

False-positive considerations:

Some advisories require custom servers, Edge runtime, rewrites, image
optimization, or other specific features. The audit cannot determine route-
level reachability.

Advisories:

- <https://github.com/advisories/GHSA-89xv-2m56-2m9x>
- <https://github.com/advisories/GHSA-6gpp-xcg3-4w24>
- <https://github.com/advisories/GHSA-m99w-x7hq-7vfj>
- <https://github.com/advisories/GHSA-p9j2-gv94-2wf4>

### DEP-002 — Critical websocket-driver advisory through Firebase

Severity: Critical  
Status: Open

Evidence:

Installed path:

```text
websocket-driver@0.7.4
└─ faye-websocket@0.11.4
   └─ @firebase/database@1.1.3
      ├─ firebase@12.14.0
      └─ firebase-admin@13.10.0
```

Direct Firebase declarations are at `package.json:31-32`. Bun reports
GHSA-xv26-6w52-cph6 (protocol length-header message corruption) and a moderate
resource-limit bypass for versions below `0.7.5`.

Impact:

Exploitability depends on whether the vulnerable WebSocket implementation is
reached in this application's Firebase database usage and whether an attacker
can influence the peer/message stream. The advisory severity is critical, but
the audit alone does not prove runtime reachability.

Recommended fix:

Prefer a Firebase/Firebase Admin update that resolves
`websocket-driver >=0.7.5`. If no upstream update is available, evaluate a
lockfile override to `0.7.5` in an isolated dependency-remediation change and
test Firebase authentication/database connection, reconnect, emulator, and
admin workflows before deployment.

Advisory:

<https://github.com/advisories/GHSA-xv26-6w52-cph6>

### DEP-003 — Additional vulnerable transitive packages

Severity: High aggregate  
Status: Open

`bun audit --json` reported the following additional packages:

| Package(s) | Advisories | Highest severity | Main installed path/context |
| --- | ---: | --- | --- |
| `ws@8.20.1` | 1 | High | `@tanstack/react-devtools` |
| `sharp@0.34.5` | 1 | High | optional Next.js image dependency |
| `form-data@2.5.5`, `protobufjs@7.6.2`, `uuid@8/9` | 4 | High | Firebase Admin / Google Cloud |
| `hono@4.12.23`, `@hono/node-server@1.19.14`, `body-parser@2.2.2`, `fast-uri@3.1.2` | 12 | High | `shadcn` → MCP SDK/Express/AJV; predominantly tooling |
| `brace-expansion@1.1.15` and `5.0.6`, `js-yaml@4.2.0` | 3 | High | ESLint/TypeScript/shadcn tooling |
| `postcss@8.4.31` | 1 | Moderate | bundled by Next.js |

Recommended fix:

1. Upgrade direct framework/Firebase dependencies first.
2. Move CLI-only packages out of production dependencies when feasible.
3. Update or remove production-unneeded React devtools.
4. Refresh the Bun lockfile and rerun `bun audit --json`.
5. Verify production reachability before using overrides for deep
   transitives.

False-positive considerations:

Several paths are development or CLI tooling and may not ship in the
production bundle. They still affect developer/CI environments and remain
visible to the package audit. `ws@8.21.0` used by Convex is patched; the
reported `ws` finding is the separate `8.20.1` copy under TanStack devtools.

## Verification performed

- `npm run test:table` — 13 passed, 0 failed;
- `npm run lint -- components/table` — clean;
- `npx tsc --noEmit` — clean;
- `npm run build` — successful production build;
- `git diff --check` — clean;
- `bun audit --json` — 33 open dependency advisories.

## Recommended remediation order

1. Upgrade Next.js and its matching ESLint config.
2. Resolve `websocket-driver` through Firebase updates or a tested override.
3. Update/remove vulnerable devtool and CLI-only dependency paths.
4. Add mounted browser tests for table selection, URL navigation,
   keyboard interaction, and bulk confirmations.
5. Review every backend callback wired to `onDeleteSelected`,
   `onBulkUpdateSelected`, editable cells, and row actions for authentication,
   per-record authorization, runtime validation, allow-listed updates, and
   batch limits.
