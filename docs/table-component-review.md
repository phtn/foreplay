# Table component implementation review

Date: 2026-07-23

Scope: `components/table/`, its local UI composition, TanStack Table state,
URL persistence, bulk actions, generic cell factories, client performance, and
security boundaries.

## Executive result

The table is now a single controlled state boundary with row-level rendering
that scales with the visible page rather than with duplicated state
subscriptions. Production build, TypeScript, targeted lint, and parser tests
all pass.

The largest previous cost was architectural: row controls, headers, and filter
controls independently subscribed to query parameters already owned by the
root. A selection change could therefore notify work proportional to the
number of rendered rows. Column visibility also changed every row key,
remounting the entire body.

The refactor makes URL ownership constant with respect to row count:

```text
URL/query state
      |
      v
DataTable (single owner) -----> onQueryStateChange (manual/server mode)
      |
      v
TanStack controlled state
   /        |         \
toolbar   memo rows   paginator
             |
          visible cells
```

## Findings and resolutions

| Area | Previous behavior and impact | Resolution |
| --- | --- | --- |
| URL subscriptions | Selection and pin controls subscribed once per row; sort and filter children duplicated root state. State notifications grew with rendered rows. | All query hooks now live in `DataTable`; children use TanStack state and callbacks. |
| Visibility | Row keys included a visibility signature, forcing full unmount/remount and destroying cell-local state. | Rows keep stable `row.id` keys and receive controlled visibility directly. A single animated `<colgroup>` collapses layout while mounted header/cell content fades and becomes inert. |
| Cell enumeration | Rows called `getAllCells().filter(...)`. | Rows retain all cells during visibility transitions and mark collapsed cells from the controlled visibility state. |
| Selection column | Checkbox and animation trees existed for every row even when selection mode was off. | The column is created only when selection mode is enabled; motion was removed. |
| Search | Every keystroke wrote the URL and synchronously retriggered filtering. | Input remains responsive; filtering and URL updates are debounced by 150 ms and run in a transition. |
| Global matching | Query and every row token were repeatedly Unicode-normalized. | TanStack resolves the normalized query once; normalized row/column tokens use a `WeakMap` cache. |
| Data synchronization | Props were mirrored into state in an effect, producing a stale render followed by a synchronization render. | Prop data is used immediately. Local fallback edits use a source-tagged override without an effect. |
| Scroll layout | Nested table wrappers each created horizontal overflow behavior. | One scrolling card contains a native semantic table. |
| Action menus | Every closed row allocated its complete dropdown; menu items did not execute actions. | Menu content mounts only while open; items execute, disable, show pending state, and surface failure. |
| Destructive UX | A toolbar shortcut immediately called bulk deletion while the editor separately offered confirmation. | The redundant immediate-delete path was removed; bulk deletion goes through the editor confirmation. |
| Filters | Duplicate option reduction was quadratic and all unique values were mounted. | Token maps make reduction linear; only a bounded option window is mounted and searchable. |
| Empty state | “Loading” was simulated with an unconditional five-second timer. | Loading is explicit and controlled by the caller. |
| Bulk editing | Every primitive column was mutable by default; select fields had no trigger/items; invalid numeric input could leak through. | Editing is explicit opt-in, selects are fully composed, options are bounded, and finite numbers are required. |
| Editable cells | Generic cells imported order/user Convex schemas and expected React to provide a mutation as a second component argument. React never supplies that argument. | Cells are domain-agnostic callback factories. Persistence and error handling are explicit. |
| Navigation | Link bases and row values were concatenated without same-origin validation or path-segment encoding. | Internal paths are validated and row values are encoded; unsafe links become text. |
| Multiple tables | Every instance used the same query keys. | `queryParamPrefix` isolates state per table. |
| Scale path | The API always applied client pagination, filtering, and sorting. | Manual pagination/filtering/sorting plus `totalRowCount` and `onQueryStateChange` support backend-owned datasets. |

Three dead internal files were removed: the visibility context superseded by
root control, a no-op view-style toggle, and an entirely commented date-range
file. The now-redundant immediate-delete toolbar component was removed as
well.

## Complexity and scaling

Let:

- `N` be client rows,
- `P` be current page size,
- `C` be visible columns,
- `S` be globally searchable columns.

Client mode has approximately:

- `O(P × C)` rendered cell work;
- `O(N × S)` global filter scanning;
- `O(N log N)` sorting;
- `O(N)` row storage plus faceted-value maps.

The rendered page is bounded to 500 rows through URL parsing. That prevents a
crafted link from overriding the UI into an effectively unbounded render, but
it does not make a large full dataset inexpensive: client filtering, sorting,
and faceting still scan `N`.

Recommended operating modes:

| Dataset/use case | Mode |
| --- | --- |
| Hundreds to a few thousand simple rows already resident in the browser | Client mode with normal page sizes (25–100). |
| Large rows, high-cardinality facets, expensive accessors, or tens of thousands of rows | Manual filtering/sorting/pagination; return one page from the backend. |
| A requirement to display many hundreds or thousands of rows simultaneously | Add row virtualization as a separate rendering mode; do not raise `pageSize`. |
| Cross-page bulk selection over manually paged backend data | Use a server-owned selection/query token rather than retaining every ID in the URL. |

These are starting points, not universal thresholds. Profile representative
production data and cell renderers. Heavy avatars, popovers, charts, or custom
cells can move the crossover much lower.

## State and API design

State that drives fetching is exposed as `DataTableQueryState`. This is a
minimal interface—pagination, sorting, column filters, and debounced search—
so a backend adapter does not depend on the full mutable TanStack table
instance.

Local visual state stays local:

- row action open/pending/error state belongs to that row action;
- bulk-editor drafts belong to the editor;
- selection/pinning/visibility remain controlled at the table boundary.

The component keeps backward-compatible default query keys. Routes with more
than one table must provide a stable, unique `queryParamPrefix`.

## Security analysis

No raw-HTML sinks, `eval`, or direct DOM HTML mutation were found in the table
scope. React continues to escape displayed row values.

Implemented defenses:

- URL payload lengths, counts, page indices, page sizes, filter values, and
  persisted IDs are bounded.
- Delimiter-bearing values are encoded before serialization.
- `__proto__`, `constructor`, and `prototype` cannot become object keys from
  URL state.
- navigation helpers accept same-origin absolute paths only;
- bulk fields require explicit opt-in;
- destructive/update callbacks expose pending states and failures;
- generic cells no longer hide a database mutation assumption.

Residual trust boundary:

The browser is never authoritative. A user can construct callbacks or requests
without this UI, alter query parameters, and change submitted update objects.
Every Convex/server function reached by table actions must authenticate,
authorize each row, use runtime validators, allow-list fields, and limit batch
size. UI `disabled`, `hidden`, selection state, and `bulkEditor` metadata are
usability controls only.

Persisted row IDs are visible in the URL. Use opaque non-secret identifiers and
avoid URL selection persistence for highly sensitive datasets.

Repository dependency findings are tracked separately in
`security_best_practices_report.md`.

## Compatibility notes

Intentional behavior/API changes:

- bulk editing now requires `meta.bulkEditor: true` or a config object;
- `editableStatusCell`, `toggleCell`, and `editableCell` take persistence
  callbacks instead of Convex function references;
- `createUserCell().getHref` accepts the row and returns a complete path;
- the selection column does not exist while selection mode is off;
- selecting all applies to the current page;
- row action callback types allow promises.

There are currently no imports of `components/table` elsewhere in this
repository, so these changes do not break an in-repository caller. External
consumers should migrate the callback factory signatures before adoption.

## Verification evidence

Completed successfully:

- `npm run test:table` — 13 tests passed;
- `npm run lint -- components/table` — no warnings or errors;
- `npx tsc --noEmit`;
- `npm run build` — Next.js production compilation, type checking, and route
  generation;
- `git diff --check`.

The repository-wide `npm run lint` was also attempted. It remains nonzero for
out-of-scope errors in `hooks/use-mobile.ts` and the untracked
`gleamability/scripts/analyze.js`; the focused table lint is clean.

The table does not yet have mounted interaction tests because this repository
does not include a React component test environment. The next testing
investment should cover selection, URL back/forward synchronization, manual
pagination, bulk confirmations, and keyboard interaction in a browser runner.
