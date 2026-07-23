'use client'

import {
  type Column,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type Row,
  type RowPinningState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState
} from '@tanstack/react-table'
import { parseAsBoolean, useQueryStates } from 'nuqs'
import {
  type ChangeEvent,
  type ReactNode,
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState
} from 'react'

import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DialogWindow } from '@/components/ui/window'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ColumnSort } from './column-sort'
import { ColumnView } from './column-view'
import {
  type ActionConfig,
  type ColumnConfig,
  createColumns,
  globalFilterFn
} from './create-column'
import { EmptyTable } from './empty-table'
import { Filter } from './filter'
import { HyperWrap } from './hyper-wrap'
import { MultiSelect } from './multi-select'
import { type PageControl, Paginator } from './pagination'
import {
  createColumnFiltersParser,
  createColumnVisibilityParser,
  createLoadedCountParser,
  createPaginationParser,
  createRowPinningParser,
  createRowSelectionParser,
  createSortingParser,
  searchParser,
  selectModeParser,
  TABLE_QUERY_LIMITS
} from './parsers'
import { RenderRow } from './render-row'
import { Search } from './search'
import { SelectToggle } from './select-toggle'
import {
  CenterTableToolbar,
  LeftTableToolbar,
  RightTableToolbar
} from './toolbar'

export interface TableToolbarContext<T> {
  getFilteredData: () => T[]
}

export interface BulkUpdateSelectionArgs<T> {
  ids: string[]
  rows: T[]
  updates: Partial<T>
}

export interface DataTableQueryState {
  columnFilters: ColumnFiltersState
  globalFilter: string
  pagination: PaginationState
  sorting: SortingState
}

export type RowIdAccessor<T> =
  | keyof T
  | ((row: T, index: number) => string | number | null | undefined)

export interface DataTableProps<T> {
  data: T[]
  title?: string
  loading: boolean
  editingRowId: string | null
  columnConfigs: ColumnConfig<T>[]
  actionConfig?: ActionConfig<T>
  onDeleteSelected?: (ids: string[]) => void | Promise<void>
  deleteActionLabel?: string
  onBulkUpdateSelected?: (
    args: BulkUpdateSelectionArgs<T>
  ) => void | Promise<void>
  deleteIdAccessor?: keyof T
  selectedItemId?: string | null
  /** Default rows per page. Values above 500 are clamped. */
  defaultPageSize?: number
  /** Default loaded row count when no URL param is set. */
  defaultLoadedCount?: number
  /** Exact query param key for the loaded count. Overrides queryParamPrefix. */
  loadedCountParamKey?: string
  /** Initial column visibility when no column visibility URL param is set. */
  defaultColumnVisibility?: VisibilityState
  centerToolbarDateRange?: ReactNode
  rightToolbarLeft?:
    | ReactNode
    | ((context: TableToolbarContext<T>) => ReactNode)
  /** Enables a pin column that keeps rows above the table body. */
  enableRowPinning?: boolean
  /** Exact query param key for pinned rows. Overrides queryParamPrefix. */
  rowPinningParamKey?: string
  /**
   * Stable, unique row identifier. Required for durable selection/pinning when
   * rows can be inserted, removed, reordered, paged, or refreshed.
   */
  rowIdAccessor?: RowIdAccessor<T>
  /**
   * Namespaces all built-in query keys as `${prefix}.${key}`. Supply a unique
   * prefix when more than one table can appear on the same route.
   */
  queryParamPrefix?: string
  /** Delay before client filtering and URL search state update. Defaults to 150ms. */
  searchDebounceMs?: number
  /**
   * Use pre-paginated data supplied by the parent. Pair with totalRowCount and
   * onQueryStateChange to fetch pages without client-side row slicing.
   */
  manualPagination?: boolean
  /** Skip client-side filtering because the parent/backend filters the data. */
  manualFiltering?: boolean
  /** Skip client-side sorting because the parent/backend sorts the data. */
  manualSorting?: boolean
  /** Total backend row count used by manual pagination. */
  totalRowCount?: number
  /** Notifies the parent when URL-backed fetch inputs change. */
  onQueryStateChange?: (state: DataTableQueryState) => void
}

interface LocalDataState<T> {
  source: T[]
  value: T[]
}

const UNSAFE_ROW_IDS = new Set([
  '__proto__',
  'constructor',
  'prototype'
])

const getFallbackRowIdValue = <T,>(row: T) => {
  if (!row || typeof row !== 'object') {
    return null
  }

  const record = row as Record<string, unknown>
  return record._id ?? record.id ?? record.visitorId ?? record.fid ?? null
}

const resolveRowId = <T,>(
  row: T,
  index: number,
  rowIdAccessor: RowIdAccessor<T> | undefined
) => {
  const value =
    typeof rowIdAccessor === 'function'
      ? rowIdAccessor(row, index)
      : rowIdAccessor
        ? row[rowIdAccessor]
        : getFallbackRowIdValue(row)

  if (value === null || value === undefined) return String(index)

  const rowId = String(value)
  if (
    rowId.length === 0 ||
    rowId.length > TABLE_QUERY_LIMITS.tokenCharacters ||
    UNSAFE_ROW_IDS.has(rowId)
  ) {
    throw new Error(
      `DataTable row id "${rowId.slice(0, 64)}" is empty, unsafe, or longer than ${TABLE_QUERY_LIMITS.tokenCharacters} characters.`
    )
  }
  return rowId
}

const areStringArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index])

const areVisibilityStatesEqual = (
  left: VisibilityState,
  right: VisibilityState
) => {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => left[key] === right[key])
  )
}

const getQueryKey = (prefix: string | undefined, key: string) =>
  prefix ? `${prefix}.${key}` : key

export const DataTable = <T,>({
  data,
  title,
  loading,
  editingRowId,
  columnConfigs,
  actionConfig,
  onDeleteSelected,
  deleteActionLabel = 'Delete selected',
  onBulkUpdateSelected,
  deleteIdAccessor = 'id' as keyof T,
  selectedItemId,
  defaultPageSize = 100,
  defaultLoadedCount = 100,
  loadedCountParamKey,
  defaultColumnVisibility,
  centerToolbarDateRange,
  rightToolbarLeft,
  enableRowPinning = false,
  rowPinningParamKey,
  rowIdAccessor,
  queryParamPrefix,
  searchDebounceMs = 150,
  manualPagination = false,
  manualFiltering = false,
  manualSorting = false,
  totalRowCount,
  onQueryStateChange
}: DataTableProps<T>) => {
  'use no memo'

  const queryPrefix = queryParamPrefix?.trim() || undefined
  const queryKeys = useMemo(
    () => ({
      columns: getQueryKey(queryPrefix, 'columns'),
      filters: getQueryKey(queryPrefix, 'filters'),
      loadedCount:
        loadedCountParamKey ??
        getQueryKey(queryPrefix, '__tableLoadedCount'),
      multiRowCompact: getQueryKey(queryPrefix, 'multiRowCompact'),
      pageIndex: getQueryKey(queryPrefix, 'pageIndex'),
      pageSize: getQueryKey(queryPrefix, 'pageSize'),
      pinnedRows:
        rowPinningParamKey ?? getQueryKey(queryPrefix, 'pinnedRows'),
      search: getQueryKey(queryPrefix, 'search'),
      selectMode: getQueryKey(queryPrefix, 'selectMode'),
      selected: getQueryKey(queryPrefix, 'selected'),
      sort: getQueryKey(queryPrefix, 'sort')
    }),
    [loadedCountParamKey, queryPrefix, rowPinningParamKey]
  )

  const queryParsers = useMemo(
    () => ({
      ...createPaginationParser(defaultPageSize),
      globalFilter: searchParser,
      sorting: createSortingParser(),
      columnFilters: createColumnFiltersParser(),
      rowSelection: createRowSelectionParser(),
      rowPinning: createRowPinningParser(),
      selectMode: selectModeParser,
      multiRowCompact: parseAsBoolean.withDefault(false),
      loadedCount: createLoadedCountParser(defaultLoadedCount),
      columnVisibility: createColumnVisibilityParser(
        defaultColumnVisibility
      )
    }),
    [
      defaultColumnVisibility,
      defaultLoadedCount,
      defaultPageSize
    ]
  )
  const queryUrlKeys = useMemo(
    () => {
      const keys = {
        pageIndex: queryKeys.pageIndex,
        pageSize: queryKeys.pageSize,
        globalFilter: queryKeys.search,
        sorting: queryKeys.sort,
        columnFilters: queryKeys.filters,
        rowSelection: queryKeys.selected,
        rowPinning: queryKeys.pinnedRows,
        selectMode: queryKeys.selectMode,
        multiRowCompact: queryKeys.multiRowCompact,
        loadedCount: queryKeys.loadedCount,
        columnVisibility: queryKeys.columns
      }
      const values = Object.values(keys)
      if (new Set(values).size !== values.length) {
        throw new Error(
          'DataTable query keys must be unique. Check queryParamPrefix and explicit param-key overrides.'
        )
      }
      return keys
    },
    [queryKeys]
  )
  const [queryState, setQueryState] = useQueryStates(queryParsers, {
    urlKeys: queryUrlKeys,
    history: 'replace',
    scroll: false,
    shallow: true
  })
  const {
    globalFilter: globalFilterParam,
    sorting: sortingParam,
    columnFilters: columnFiltersParam,
    rowSelection: rowSelectionParam,
    rowPinning: rowPinningParam,
    selectMode: selectModeParam,
    multiRowCompact,
    loadedCount: loadedCountParam,
    columnVisibility: columnVisibilityParam
  } = queryState
  const paginationParam = queryState

  const [localDataState, setLocalDataState] =
    useState<LocalDataState<T> | null>(null)
  const [bulkAction, setBulkAction] = useState<
    'idle' | 'update' | 'delete'
  >('idle')
  const tableData =
    localDataState?.source === data ? localDataState.value : data

  const updateLocalData = useCallback(
    (updater: (current: T[]) => T[]) => {
      setLocalDataState((current) => {
        const currentValue =
          current?.source === data ? current.value : data
        return {
          source: data,
          value: updater(currentValue)
        }
      })
    },
    [data]
  )

  const paginationState: PaginationState = useMemo(
    () => ({
      pageIndex: paginationParam.pageIndex,
      pageSize: paginationParam.pageSize
    }),
    [paginationParam.pageIndex, paginationParam.pageSize]
  )

  const configuredColumns = useMemo(
    () => new Map(columnConfigs.map((config) => [config.id, config])),
    [columnConfigs]
  )
  const sorting: SortingState = useMemo(
    () =>
      (sortingParam ?? []).filter((sort) => {
        const config = configuredColumns.get(sort.id)
        return Boolean(config && config.enableSorting !== false)
      }),
    [configuredColumns, sortingParam]
  )
  const columnFilters: ColumnFiltersState = useMemo(
    () =>
      (columnFiltersParam ?? []).filter((filter) => {
        const config = configuredColumns.get(filter.id)
        return Boolean(config && config.enableFiltering !== false)
      }),
    [columnFiltersParam, configuredColumns]
  )

  const selectOn = selectModeParam === 'true'
  const columnVisibility: VisibilityState = useMemo(
    () => columnVisibilityParam ?? {},
    [columnVisibilityParam]
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchInput, setSearchInput] = useState(globalFilterParam ?? '')
  const [committedSearch, setCommittedSearch] = useState(
    globalFilterParam ?? ''
  )
  const observedSearchParamRef = useRef(globalFilterParam ?? '')
  const pendingSearchWritesRef = useRef(new Set<string>())
  const safeSearchDebounceMs = Math.max(
    0,
    Math.min(2_000, Math.floor(searchDebounceMs))
  )

  useEffect(() => {
    const nextSearch = globalFilterParam ?? ''
    if (nextSearch === observedSearchParamRef.current) return

    observedSearchParamRef.current = nextSearch
    if (pendingSearchWritesRef.current.delete(nextSearch)) return

    setSearchInput(nextSearch)
    setCommittedSearch(nextSearch)
  }, [globalFilterParam])

  useEffect(() => {
    if (searchInput === committedSearch) return

    const timeout = window.setTimeout(() => {
      const nextSearch = searchInput.slice(
        0,
        TABLE_QUERY_LIMITS.searchCharacters
      )
      if (pendingSearchWritesRef.current.size > 8) {
        pendingSearchWritesRef.current.clear()
      }
      pendingSearchWritesRef.current.add(nextSearch)

      startTransition(() => {
        setCommittedSearch(nextSearch)
        void setQueryState({
          globalFilter: nextSearch || null,
          pageIndex: 0
        })
      })
    }, safeSearchDebounceMs)

    return () => window.clearTimeout(timeout)
  }, [
    committedSearch,
    safeSearchDebounceMs,
    searchInput,
    setQueryState
  ])

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchInput(
        event.target.value.slice(0, TABLE_QUERY_LIMITS.searchCharacters)
      )
    },
    []
  )

  const clearGlobalFilter = useCallback(() => {
    pendingSearchWritesRef.current.add('')
    setSearchInput('')
    startTransition(() => {
      setCommittedSearch('')
      void setQueryState({ globalFilter: null, pageIndex: 0 })
    })
  }, [setQueryState])

  const getTableRowId = useCallback(
    (row: T, index: number) => resolveRowId(row, index, rowIdAccessor),
    [rowIdAccessor]
  )
  const rowIds = useMemo(
    () => tableData.map((row, index) => getTableRowId(row, index)),
    [getTableRowId, tableData]
  )
  const availableRowIds = useMemo(() => new Set(rowIds), [rowIds])

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' &&
      availableRowIds.size !== rowIds.length
    ) {
      console.warn(
        'DataTable received duplicate row IDs. Selection, pinning, and memoized rows require unique IDs.'
      )
    }
  }, [availableRowIds, rowIds.length])

  const rawRowSelection: RowSelectionState = useMemo(
    () => rowSelectionParam ?? {},
    [rowSelectionParam]
  )
  const rowSelection: RowSelectionState = useMemo(() => {
    if (!selectOn) return {}

    return Object.fromEntries(
      Object.keys(rawRowSelection)
        .filter(
          (rowId) =>
            rawRowSelection[rowId] === true && availableRowIds.has(rowId)
        )
        .map((rowId) => [rowId, true])
    )
  }, [availableRowIds, rawRowSelection, selectOn])

  const rowPinning: RowPinningState = useMemo(() => {
    if (!enableRowPinning) return { top: [], bottom: [] }

    return {
      top: (rowPinningParam?.top ?? []).filter((rowId) =>
        availableRowIds.has(rowId)
      ),
      bottom: []
    }
  }, [availableRowIds, enableRowPinning, rowPinningParam])

  useEffect(() => {
    if (loading) return

    const currentIds = Object.keys(rawRowSelection)
      .filter((rowId) => rawRowSelection[rowId] === true)
      .sort()
    const nextIds = Object.keys(rowSelection).sort()
    if (areStringArraysEqual(currentIds, nextIds)) return

    void setQueryState({ rowSelection })
  }, [
    loading,
    rawRowSelection,
    rowSelection,
    setQueryState
  ])

  useEffect(() => {
    if (!enableRowPinning || loading) return

    const currentTop = rowPinningParam?.top ?? []
    const nextTop = rowPinning.top ?? []
    if (areStringArraysEqual(currentTop, nextTop)) return

    void setQueryState({
      rowPinning: { top: nextTop, bottom: [] }
    })
  }, [
    enableRowPinning,
    loading,
    rowPinning,
    rowPinningParam,
    setQueryState
  ])

  useEffect(() => {
    if (
      !loadedCountParamKey ||
      loading ||
      loadedCountParam === data.length
    ) {
      return
    }
    void setQueryState({ loadedCount: data.length })
  }, [
    data.length,
    loadedCountParam,
    loadedCountParamKey,
    loading,
    setQueryState
  ])

  useEffect(() => {
    if (
      sorting.length !== (sortingParam ?? []).length
    ) {
      void setQueryState({ sorting })
    }
  }, [setQueryState, sorting, sortingParam])

  useEffect(() => {
    if (
      columnFilters.length !== (columnFiltersParam ?? []).length
    ) {
      void setQueryState({ columnFilters })
    }
  }, [
    columnFilters,
    columnFiltersParam,
    setQueryState
  ])

  const handlePaginationChange = useCallback(
    (
      updater:
        | PaginationState
        | ((current: PaginationState) => PaginationState)
    ) => {
      const nextPagination =
        typeof updater === 'function'
          ? updater(paginationState)
          : updater
      void setQueryState({
        pageIndex: nextPagination.pageIndex,
        pageSize: nextPagination.pageSize
      })
    },
    [paginationState, setQueryState]
  )

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const parsedPageSize = Number(value)
      const nextPageSize = Number.isFinite(parsedPageSize)
        ? Math.max(
            1,
            Math.min(
              TABLE_QUERY_LIMITS.pageSize,
              Math.floor(parsedPageSize)
            )
          )
        : paginationState.pageSize

      handlePaginationChange({
        pageIndex: 0,
        pageSize: nextPageSize
      })
    },
    [handlePaginationChange, paginationState.pageSize]
  )

  const handleSortingChange = useCallback(
    (
      updater: SortingState | ((current: SortingState) => SortingState)
    ) => {
      const nextSorting =
        typeof updater === 'function' ? updater(sorting) : updater
      void setQueryState({
        sorting: nextSorting,
        pageIndex: 0
      })
    },
    [setQueryState, sorting]
  )

  const handleColumnFiltersChange = useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((current: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      const nextFilters =
        typeof updater === 'function' ? updater(columnFilters) : updater
      void setQueryState({
        columnFilters: nextFilters,
        pageIndex: 0
      })
    },
    [columnFilters, setQueryState]
  )

  const handleColumnVisibilityChange = useCallback(
    (
      updater:
        | VisibilityState
        | ((current: VisibilityState) => VisibilityState)
    ) => {
      const nextVisibility =
        typeof updater === 'function'
          ? updater(columnVisibility)
          : updater
      if (
        areVisibilityStatesEqual(columnVisibility, nextVisibility)
      ) {
        return
      }
      void setQueryState({ columnVisibility: nextVisibility })
    },
    [columnVisibility, setQueryState]
  )

  const handleRowSelectionChange = useCallback(
    (
      updater:
        | RowSelectionState
        | ((current: RowSelectionState) => RowSelectionState)
    ) => {
      const nextSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater
      void setQueryState({ rowSelection: nextSelection })
    },
    [rowSelection, setQueryState]
  )

  const handleRowPinningChange = useCallback(
    (
      updater:
        | RowPinningState
        | ((current: RowPinningState) => RowPinningState)
    ) => {
      const nextPinning =
        typeof updater === 'function' ? updater(rowPinning) : updater
      const nextTop = (nextPinning.top ?? []).filter((rowId) =>
        availableRowIds.has(rowId)
      )
      void setQueryState({
        rowPinning: { top: nextTop, bottom: [] }
      })
    },
    [availableRowIds, rowPinning, setQueryState]
  )

  const selectToggle = useCallback(() => {
    const nextSelectOn = !selectOn
    void setQueryState({
      selectMode: nextSelectOn ? 'true' : 'false',
      ...(nextSelectOn ? {} : { rowSelection: {} })
    })
  }, [selectOn, setQueryState])

  const columns = useMemo(
    () =>
      createColumns(
        columnConfigs,
        actionConfig,
        selectOn,
        enableRowPinning
      ),
    [actionConfig, columnConfigs, enableRowPinning, selectOn]
  )
  const safeTotalRowCount =
    totalRowCount === undefined
      ? undefined
      : Number.isFinite(totalRowCount)
        ? Math.max(0, Math.floor(totalRowCount))
        : 0

  const getColumnCanGlobalFilter = useCallback(
    (column: Column<T, unknown>) => {
      if (column.columnDef.enableGlobalFilter === true) return true
      if (column.columnDef.enableGlobalFilter === false) return false

      const firstRow = tableData[0]
      if (!firstRow || !column.accessorFn) return false

      const value = column.accessorFn(firstRow, 0)
      return typeof value === 'string' || typeof value === 'number'
    },
    [tableData]
  )

  // TanStack Table exposes mutable callbacks that React Compiler cannot
  // memoize safely. Row rendering is memoized separately below.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableData,
    columns,
    getRowId: getTableRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getColumnCanGlobalFilter,
    globalFilterFn,
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: handleRowSelectionChange,
    onRowPinningChange: handleRowPinningChange,
    enableSortingRemoval: true,
    enableMultiSort: false,
    enableRowSelection: selectOn,
    enableRowPinning,
    keepPinnedRows: true,
    manualFiltering,
    manualPagination,
    manualSorting,
    rowCount: manualPagination ? safeTotalRowCount : undefined,
    state: {
      sorting,
      pagination: paginationState,
      columnFilters,
      globalFilter: committedSearch,
      columnVisibility,
      rowSelection,
      rowPinning
    }
  })

  const pageCount = table.getPageCount()
  const hasAuthoritativePageCount =
    !manualPagination || totalRowCount !== undefined
  useEffect(() => {
    if (loading || !hasAuthoritativePageCount) return
    const lastPageIndex = Math.max(0, pageCount - 1)
    if (paginationState.pageIndex <= lastPageIndex) return
    void setQueryState({ pageIndex: lastPageIndex })
  }, [
    hasAuthoritativePageCount,
    loading,
    pageCount,
    paginationState.pageIndex,
    setQueryState
  ])

  const notifyQueryStateChange = useEffectEvent(
    (queryState: DataTableQueryState) => {
      onQueryStateChange?.(queryState)
    }
  )

  useEffect(() => {
    if (
      !loading &&
      hasAuthoritativePageCount &&
      paginationState.pageIndex > Math.max(0, pageCount - 1)
    ) {
      return
    }
    notifyQueryStateChange({
      columnFilters,
      globalFilter: committedSearch,
      pagination: paginationState,
      sorting
    })
  }, [
    columnFilters,
    committedSearch,
    hasAuthoritativePageCount,
    loading,
    pageCount,
    paginationState,
    sorting
  ])

  const leafColumns =
    table.getAllLeafColumns() as Column<T, unknown>[]
  const columnById = useMemo(
    () =>
      new Map(
        leafColumns.map((column) => [column.id, column] as const)
      ),
    [leafColumns]
  )
  const filterableColumns = useMemo(
    () => leafColumns.filter((column) => column.getCanFilter()),
    [leafColumns]
  )
  const hideableColumns = useMemo(
    () => leafColumns.filter((column) => column.getCanHide()),
    [leafColumns]
  )
  const activeFilterColumns = useMemo(
    () =>
      columnFilters.flatMap((filter) => {
        const column = columnById.get(filter.id)
        return column?.getCanFilter()
          ? [column as Column<T, unknown>]
          : []
      }),
    [columnById, columnFilters]
  )

  const handleAddFilterColumn = useCallback(
    (columnId: string) => {
      if (columnFilters.some((filter) => filter.id === columnId)) return
      void setQueryState({
        columnFilters: [
          ...columnFilters,
          { id: columnId, value: [] as string[] }
        ],
        pageIndex: 0
      })
    },
    [columnFilters, setQueryState]
  )

  const handleRemoveFilterColumn = useCallback(
    (columnId: string) => {
      void setQueryState({
        columnFilters: columnFilters.filter(
          (filter) => filter.id !== columnId
        ),
        pageIndex: 0
      })
    },
    [columnFilters, setQueryState]
  )

  const gotoFirst = useCallback(() => {
    handlePaginationChange({ ...paginationState, pageIndex: 0 })
  }, [handlePaginationChange, paginationState])
  const gotoPrevious = useCallback(() => {
    handlePaginationChange({
      ...paginationState,
      pageIndex: Math.max(0, paginationState.pageIndex - 1)
    })
  }, [handlePaginationChange, paginationState])
  const gotoNext = useCallback(() => {
    handlePaginationChange({
      ...paginationState,
      pageIndex: paginationState.pageIndex + 1
    })
  }, [handlePaginationChange, paginationState])
  const gotoLast = useCallback(() => {
    handlePaginationChange({
      ...paginationState,
      pageIndex: Math.max(0, pageCount - 1)
    })
  }, [handlePaginationChange, pageCount, paginationState])

  const canGoToPreviousPage = table.getCanPreviousPage()
  const canGoToNextPage = table.getCanNextPage()
  const pageControl: PageControl = useMemo(
    () => ({
      gotoFirst,
      disabledPrev: !canGoToPreviousPage,
      gotoPrev: gotoPrevious,
      disabledNext: !canGoToNextPage,
      gotoNext,
      gotoLast
    }),
    [
      canGoToNextPage,
      canGoToPreviousPage,
      gotoFirst,
      gotoLast,
      gotoNext,
      gotoPrevious
    ]
  )

  const tableRows = enableRowPinning
    ? [...table.getTopRows(), ...table.getCenterRows()]
    : table.getRowModel().rows
  const selectedRows = table.getSelectedRowModel().rows
  const selectedRowData = useMemo(
    () => selectedRows.map((row) => row.original),
    [selectedRows]
  )
  const selectedRowSignature = useMemo(
    () =>
      selectedRows
        .map((row) => row.id)
        .sort()
        .join('|'),
    [selectedRows]
  )

  const getSelectionIds = useCallback(
    (rows: Row<T>[]) =>
      rows.map((row) => {
        const value = row.original[deleteIdAccessor]
        return value == null ? row.id : String(value)
      }),
    [deleteIdAccessor]
  )

  const clearSelection = useCallback(() => {
    void setQueryState({ rowSelection: {} })
  }, [setQueryState])

  const handleDeleteSelectedRows = useCallback(async () => {
    if (selectedRows.length === 0 || bulkAction !== 'idle') return

    setBulkAction('delete')
    try {
      if (onDeleteSelected) {
        await onDeleteSelected(getSelectionIds(selectedRows))
      } else {
        const selectedRowIds = new Set(
          selectedRows.map((row) => row.id)
        )
        updateLocalData((current) =>
          current.filter(
            (item, index) =>
              !selectedRowIds.has(getTableRowId(item, index))
          )
        )
      }
      clearSelection()
    } finally {
      setBulkAction('idle')
    }
  }, [
    bulkAction,
    clearSelection,
    getSelectionIds,
    getTableRowId,
    onDeleteSelected,
    selectedRows,
    updateLocalData
  ])

  const handleBulkUpdateRows = useCallback(
    async (updates: Partial<T>) => {
      if (
        selectedRows.length === 0 ||
        Object.keys(updates).length === 0 ||
        bulkAction !== 'idle'
      ) {
        return
      }

      setBulkAction('update')
      try {
        if (onBulkUpdateSelected) {
          await onBulkUpdateSelected({
            ids: getSelectionIds(selectedRows),
            rows: selectedRowData,
            updates
          })
        } else {
          const selectedRowIds = new Set(
            selectedRows.map((row) => row.id)
          )
          updateLocalData((current) =>
            current.map((item, index) => {
              if (
                !selectedRowIds.has(getTableRowId(item, index))
              ) {
                return item
              }

              return {
                ...(item as Record<string, unknown>),
                ...(updates as Record<string, unknown>)
              } as T
            })
          )
        }
      } finally {
        setBulkAction('idle')
      }
    },
    [
      bulkAction,
      getSelectionIds,
      getTableRowId,
      onBulkUpdateSelected,
      selectedRowData,
      selectedRows,
      updateLocalData
    ]
  )

  const getFilteredData = useCallback(
    () => {
      // The table instance is stable while its derived row models change.
      void columnFilters
      void columns
      void committedSearch
      void tableData
      return table
        .getFilteredRowModel()
        .rows.map((row) => row.original)
    },
    [
      columnFilters,
      columns,
      committedSearch,
      table,
      tableData
    ]
  )
  const toolbarLeftContent = useMemo(
    () =>
      typeof rightToolbarLeft === 'function'
        ? rightToolbarLeft({ getFilteredData })
        : rightToolbarLeft,
    [getFilteredData, rightToolbarLeft]
  )

  const visibleLeafColumns = table.getVisibleLeafColumns()
  const visibleColumnSignature = visibleLeafColumns
    .map((column) => column.id)
    .join('\u001f')

  return (
    <div className='max-w-full overflow-hidden text-foreground'>
      <div className='relative inset-0 mb-0 w-screen overflow-hidden md:w-full md:max-w-[84lvw] md:pb-8'>
        {title ? (
          <h2 className='mb-1 truncate font-clash text-sm font-medium'>
            {title}
          </h2>
        ) : null}

        <div className='portrait:sticky flex min-h-10.5 w-full max-w-full shrink-0 flex-nowrap items-center justify-between gap-2 overflow-x-auto overflow-y-visible md:gap-0'>
          <div className='flex shrink-0 flex-nowrap items-center gap-2 md:gap-3'>
            <LeftTableToolbar
              select={
                <SelectToggle
                  on={selectOn}
                  toggleFn={selectToggle}
                  selectedCount={selectedRows.length}
                />
              }
            />
            <CenterTableToolbar
              filter={
                <Filter
                  columns={filterableColumns}
                  activeFilterColumns={activeFilterColumns}
                  columnFilters={columnFilters}
                  facetingData={tableData}
                  globalFilter={committedSearch}
                  onAddFilterColumn={handleAddFilterColumn}
                  onRemoveFilterColumn={handleRemoveFilterColumn}
                />
              }
              dateRange={centerToolbarDateRange}
              view={
                <ColumnView
                  cols={hideableColumns}
                  onColumnVisibilityChange={
                    handleColumnVisibilityChange
                  }
                />
              }
            />
          </div>
          <RightTableToolbar
            left={toolbarLeftContent}
            search={
              <Search
                ref={inputRef}
                onChange={handleFilterChange}
                onClear={clearGlobalFilter}
                value={searchInput}
              />
            }
          />
        </div>

        <HyperWrap className='h-[calc(100svh-7rem)] w-full max-w-full overflow-auto pb-2 md:h-[93lvh] md:w-full md:pb-12'>
          <table
            data-slot='table'
            aria-busy={loading}
            aria-label={title ?? 'Data table'}
            className='w-fit min-w-full table-fixed caption-bottom text-sm md:min-w-4xl'
            style={{ width: table.getTotalSize() }}>
            <TableHeader className='w-full'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className='h-7 bg-dark-table dark:bg-dark-table/0 md:h-8'>
                  {headerGroup.headers.map((header) => {
                    const headerSize = header.getSize()
                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={
                          header.column.getCanSort()
                            ? header.column.getIsSorted() === 'asc'
                              ? 'ascending'
                              : header.column.getIsSorted() === 'desc'
                                ? 'descending'
                                : 'none'
                            : undefined
                        }
                        style={{
                          width: headerSize,
                          minWidth: headerSize,
                          maxWidth: headerSize
                        }}
                        className={cn(
                          'sticky top-0 z-20 h-7 overflow-hidden bg-[#eceef2] ps-2 uppercase md:h-8',
                          'font-clash text-xs font-medium tracking-tight text-dark-table/80 dark:bg-dark-table dark:text-zinc-300 md:text-sm'
                        )}>
                        <ColumnSort
                          flexRender={flexRender}
                          header={header}
                          sorted={header.column.getIsSorted()}
                        />
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {tableRows.length > 0 ? (
                tableRows.map((row) => (
                  <RenderRow
                    key={row.id}
                    row={row}
                    isActive={selectedItemId === row.id}
                    isEditing={editingRowId === row.id}
                    isPinned={row.getIsPinned() === 'top'}
                    isSelected={row.getIsSelected()}
                    showSelectColumn={selectOn}
                    visibleColumnSignature={visibleColumnSignature}
                  />
                ))
              ) : (
                <EmptyTable
                  colSpan={visibleLeafColumns.length}
                  loading={loading}
                />
              )}
            </TableBody>
          </table>

          <Paginator
            state={paginationState}
            rowCount={table.getRowCount()}
            setPageSize={handlePageSizeChange}
            pageControl={pageControl}
          />
        </HyperWrap>
      </div>

      <DialogWindow
        open={selectedRows.length > 0}
        onOpenChange={(open) => {
          if (!open) clearSelection()
        }}
        actions={
          <button
            type='button'
            aria-label={
              multiRowCompact
                ? 'Expand multi-row editor'
                : 'Compact multi-row editor'
            }
            aria-pressed={multiRowCompact}
            onClick={() =>
              void setQueryState({
                multiRowCompact: !multiRowCompact
              })
            }
            className='rounded-md p-1 text-muted-foreground hover:bg-sidebar hover:text-foreground'>
            <Icon
              name='minus'
              className={cn('size-3.5', {
                'mx-0.5': multiRowCompact
              })}
            />
          </button>
        }
        title={<span className='text-lg'>Multi-Row Editor</span>}
        description='Review and confirm changed values before they are applied.'
        className={cn(
          'left-auto right-3 top-30 bottom-16 h-auto max-h-none w-[calc(100vw-1.5rem)] max-w-124 translate-x-0 rounded-xl border-dark-table/20',
          'md:right-6 md:top-24 md:bottom-6 md:w-[min(calc(100vw-3rem),31rem)]',
          multiRowCompact &&
            'w-[min(calc(100vw-16rem),32rem)] md:w-[min(calc(100vw-20rem),16rem)]'
        )}>
        <MultiSelect
          key={selectedRowSignature}
          selectedRows={selectedRowData}
          columnConfigs={columnConfigs}
          pending={loading || bulkAction !== 'idle'}
          onApply={handleBulkUpdateRows}
          onDeleteSelected={handleDeleteSelectedRows}
          deleteActionLabel={deleteActionLabel}
          isCompact={multiRowCompact}
        />
      </DialogWindow>
    </div>
  )
}
