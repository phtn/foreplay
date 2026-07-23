# DataTable

`DataTable` is a client-side, URL-controlled wrapper around TanStack Table v8.
It owns pagination, sorting, filtering, visibility, selection, and pinning once
at the table root. Rows and cells consume TanStack state directly; they do not
create their own URL subscriptions.

## Performance contract

Keep these inputs referentially stable:

- `data`
- `columnConfigs`
- `actionConfig`
- callback props
- `defaultColumnVisibility`

Build configurations with `useMemo` and callbacks with `useCallback` when the
parent re-renders frequently. TanStack Table uses the identity of `data` and
column definitions as cache boundaries.

Always provide `rowIdAccessor` when rows can be reordered, inserted, deleted,
refetched, or paged:

```tsx
const columns = useMemo<ColumnConfig<User>[]>(
  () => [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: textCell<User, 'name'>('name')
    }
  ],
  []
)

<DataTable
  data={users}
  loading={false}
  editingRowId={null}
  columnConfigs={columns}
  rowIdAccessor='_id'
  queryParamPrefix='users'
/>
```

Index-based row IDs are only a fallback. They are not durable across sorting,
filtering, insertion, deletion, or server pagination.
Explicit row IDs must be non-empty, prototype-safe strings of at most 512
characters so their table and URL representations stay identical.

Column IDs must be unique. `select`, `pin-row`, and `actions` are reserved for
the component's structural columns; JavaScript prototype-special names are
also rejected.

### Cost model

In client mode:

- displayed DOM work is approximately `O(pageSize × visibleColumns)`;
- global filtering is approximately `O(rows × searchableColumns)`;
- sorting is approximately `O(rows log rows)`;
- faceting scans the filtered client dataset and retains its distinct values.

The URL parser caps `pageSize` at 500. This is a safety ceiling, not a target.
The normal default is 100. Search is debounced, normalized row tokens are
cached by row identity, closed action menus do not mount their contents, and
faceted option lists mount at most 200 items by default.

Use client mode for modest datasets where the complete row set is already
needed in the browser. Switch to manual mode before network transfer, faceting,
sorting, or filtering becomes the bottleneck:

```tsx
<DataTable
  data={page.rows}
  loading={isLoading}
  editingRowId={null}
  columnConfigs={columns}
  rowIdAccessor='_id'
  queryParamPrefix='accounts'
  manualPagination
  manualFiltering
  manualSorting
  totalRowCount={page.total}
  onQueryStateChange={setFetchInput}
/>
```

`onQueryStateChange` receives pagination, sorting, column filters, and the
debounced global search value. In fully manual mode, the backend must apply
those inputs and return only the requested page.

Selection and pinning are scoped to the supplied `data`: IDs not present in it
are removed. Client mode can therefore retain selection across its in-memory
pages. Manual mode normally supplies one backend page, so selection is
page-scoped. Cross-page server bulk selection needs a separate server-owned
selection model; it should not be inferred from the current page.

TanStack Table is headless and does not virtualize rows itself. If one client
page genuinely needs hundreds or thousands of visible rows, add a dedicated
virtualizer rather than raising the parser ceiling. See the official
[virtualization guide](https://tanstack.com/table/latest/docs/guide/virtualization)
and [pagination guide](https://tanstack.com/table/v8/docs/guide/pagination).

## URL state

Without `queryParamPrefix`, the component keeps the existing keys such as
`search`, `sort`, `filters`, `selected`, `columns`, `pageIndex`, and
`pageSize`.

When multiple tables share one route, give every table a unique prefix:

```tsx
<DataTable queryParamPrefix='open-orders' {...openOrdersProps} />
<DataTable queryParamPrefix='closed-orders' {...closedOrdersProps} />
```

This produces keys such as `open-orders.search` and
`closed-orders.pageIndex`, preventing the tables from controlling each other.

URL values are encoded, length-bounded, count-bounded, and checked before they
become object keys. Selection and pinning persist at most 500 IDs. Search
persists at most 512 characters. Do not put secrets or sensitive personal data
in row IDs: persisted IDs remain visible in the address bar and browser
history.

## Filtering

Columns are filterable by default. Useful metadata:

```tsx
{
  id: 'status',
  accessorKey: 'status',
  header: 'Status',
  meta: {
    filterOptions: ['draft', 'active', 'archived'],
    filterOptionLimit: 100
  }
}
```

For a high-cardinality field, prefer an explicit bounded option source or a
backend filter UI. Client faceting still has to inspect all client rows even
though the popover mounts only a bounded number of options.

Set `enableGlobalFiltering: false` for large text, object, action, or otherwise
irrelevant columns. The default global-filter heuristic considers string and
number values from the first row.

## Bulk editing and mutations

Bulk editing is opt-in per field:

```tsx
{
  id: 'status',
  accessorKey: 'status',
  header: 'Status',
  meta: {
    bulkEditor: {
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' }
      ]
    }
  }
}
```

`bulkEditor: true` opts in an inferred primitive editor. Omitting the property,
or setting it to `false`, excludes the field. Identifier fields are always
excluded.

This UI allow-list is not an authorization boundary. `onBulkUpdateSelected`,
`onDeleteSelected`, row actions, and editable-cell callbacks must call backend
functions that:

- authenticate the current user;
- authorize every target row;
- validate IDs, values, and allowed update keys at runtime;
- reject fields that are server-owned or immutable;
- enforce batch-size and rate limits where appropriate.

Do not spread `updates` directly into a database record. Construct a validated
patch from a backend-owned allow-list.

The editable cell factories in `cells.tsx` accept explicit persistence
callbacks. They no longer import Convex functions or assume a domain-specific
table or mutation argument shape.

## Navigation cells

`linkText` treats its `href` argument as a same-origin base path and appends
the cell value as one encoded path segment. `createUserCell().getHref` returns
a complete same-origin path. Unsafe, protocol-relative, external, or
backslash-based values render as plain text instead of a link.

## Notable behavior

- Selection mode mounts the selection column only while enabled.
- “Select all” selects the current page, matching the pagination UI.
- Changing search, sorting, filters, or page size resets to page 1.
- Sort controls cycle through ascending, descending, and unsorted.
- Column visibility re-renders rows but no longer remounts them.
- Row action failures can be handled with `actionConfig.onActionError`.
- Bulk deletion is available through the editor's confirmation flow; there is
  no separate immediate-delete toolbar shortcut.
- `queryParamPrefix` should remain stable for the lifetime of the table.

## Verification

Run:

```sh
npm run test:table
npm run lint -- components/table
npx tsc --noEmit
npm run build
```

The suite covers parser bounds and round trips, prototype-key rejection,
visibility, selection, pinning, normalized filters, and safe navigation.
