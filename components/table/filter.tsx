import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Button as BaseButton, Checkbox } from '@base-ui/react'
import { Popover } from '@base-ui/react/popover'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { Column } from '@tanstack/react-table'
import { memo, useId, useMemo, useState } from 'react'
import { smap } from './custom-maps'
import { normalizeText } from './filter-fns'
import { getColumnHeaderText, getFilterValueLabel, getFilterValueToken } from './filter-utils'
import { TABLE_QUERY_LIMITS } from './parsers'

interface Props<T> {
  columns: Column<T, unknown>[]
  activeFilterColumns: Column<T, unknown>[]
  columnFilters: ColumnFiltersState
  facetingData: T[]
  globalFilter: string
  onAddFilterColumn?: (columnId: string) => void
  onRemoveFilterColumn?: (columnId: string) => void
}

type FilterOption = {
  count: number
  label: string
  searchText: string
  token: string
}

const DEFAULT_FACET_OPTION_LIMIT = 200

const FilterComponent = <T,>({
  columns,
  activeFilterColumns,
  columnFilters,
  facetingData,
  globalFilter,
  onAddFilterColumn,
  onRemoveFilterColumn
}: Props<T>) => {
  const baseId = useId()
  const [optionQueries, setOptionQueries] = useState<Record<string, string>>({})

  const filterableColumns = useMemo(
    () => columns.filter((col) => col.getCanFilter() && col.id !== 'select' && col.id !== 'actions'),
    [columns]
  )

  const activeFilterIds = useMemo(() => new Set(activeFilterColumns.map((column) => column.id)), [activeFilterColumns])

  const availableColumns = useMemo(
    () => filterableColumns.filter((column) => !activeFilterIds.has(column.id)),
    [activeFilterIds, filterableColumns]
  )

  const activeFiltersData = useMemo(() => {
    // TanStack columns are stable objects whose faceted maps change when the
    // backing data or global filter changes.
    void facetingData
    void globalFilter

    return activeFilterColumns.map((column) => {
      const facetedValues = column.getFacetedUniqueValues()
      const controlledFilter = columnFilters.find((filter) => filter.id === column.id)
      const selectedValues = (controlledFilter?.value ?? []) as (string | number | boolean)[]
      const meta = column.columnDef.meta as { filterOptions?: unknown[]; filterOptionLimit?: number } | undefined
      const metaFilterOptions = meta?.filterOptions
      const optionLimit = Math.max(1, Math.min(1_000, meta?.filterOptionLimit ?? DEFAULT_FACET_OPTION_LIMIT))

      const countByToken = new Map<string, number>()
      const rawValueByToken = new Map<string, unknown>()

      for (const [rawValue, count] of facetedValues.entries()) {
        const token = getFilterValueToken(rawValue)
        countByToken.set(token, (countByToken.get(token) ?? 0) + count)
        if (!rawValueByToken.has(token)) {
          rawValueByToken.set(token, rawValue)
        }
      }

      const optionSource = Array.isArray(metaFilterOptions) ? metaFilterOptions : Array.from(rawValueByToken.values())
      const uniqueOptions = new Map<string, FilterOption>()

      for (const rawValue of optionSource) {
        const token = getFilterValueToken(rawValue)
        if (!token || uniqueOptions.has(token)) continue
        const label = getFilterValueLabel(rawValue)
        uniqueOptions.set(token, {
          token,
          label,
          searchText: normalizeText(label),
          count: countByToken.get(token) ?? 0
        })
      }

      const uniqueValues = Array.from(uniqueOptions.values()).sort((a, b) => a.label.localeCompare(b.label))

      return {
        column,
        optionLimit,
        selectedValues: Array.isArray(selectedValues) ? selectedValues : [],
        uniqueValues
      }
    })
  }, [activeFilterColumns, columnFilters, facetingData, globalFilter])

  const totalActiveFilters = useMemo(() => {
    return activeFiltersData.reduce((total, filterData) => {
      return total + filterData.selectedValues.length
    }, 0)
  }, [activeFiltersData])

  const handleColumnAdd = (columnId: string) => {
    if (!activeFilterColumns.some((col) => col.id === columnId)) {
      onAddFilterColumn?.(columnId)
    }
  }

  const handleColumnRemove = (columnId: string) => {
    onRemoveFilterColumn?.(columnId)
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        className='select-none'
        render={
          <BaseButton
            className={cn(
              'relative flex w-8 h-8 md:h-7.5 items-center justify-center rounded-sm md:space-x-2 md:w-auto md:px-3.5 text-sm select-none transition-colors duration-75',
              'data-pressed:bg-indigo-100/20 dark:data-pressed:bg-indigo-200/10',
              'hover:bg- dark:hover:bg-',
              'active:bg-foreground/10 dark:active:bg-',
              'focus-visible:bg-none focus-visible:outline-1 focus-visible:-outline-offset-1',
              { 'px-0 md:px-3.5': totalActiveFilters > 0 }
            )}>
            {totalActiveFilters > 0 ? (
              <span className='bg-indigo-500 font-okx md:-ml-1 w-5 rounded-sm font-semibold text-white dark:text-background dark:bg-indigo-300'>
                {totalActiveFilters > 99 ? '99+' : totalActiveFilters}
              </span>
            ) : (
              <Icon name='filter' className={cn('size-4 dark:opacity-60')} />
            )}
            <span className='hidden font-ios text-sm capitalize opacity-90 md:flex'>Filter</span>
          </BaseButton>
        }
      />
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={4}
          align='start'
          collisionAvoidance={{ side: 'flip', align: 'none' }}
          positionMethod='fixed'>
          <Popover.Popup className='select-none w-64 rounded-md p-1 border border-dark-gray/30 bg-zinc-300/30 dark:bg-zinc-900/20 backdrop-blur-3xl dark:text-zinc-200'>
            {availableColumns.length > 0 ? (
              <>
                <div className='flex items-center border-b border-dashed border-dark-gray/25 px-4 py-1 dark:border-zinc-800'>
                  <span className='text-sm font-okxs font-medium capitalize'>Add filter</span>
                </div>
                <div className='p-2'>
                  {availableColumns.map((column) => (
                    <button
                      key={column.id}
                      type='button'
                      onClick={() => handleColumnAdd(column.id)}
                      className={cn(
                        'flex h-8 w-full items-center justify-between rounded-sm px-3 text-left text-xs',
                        'text-origin hover:bg-dark-table/10 dark:text-white dark:hover:bg-origin/40 dark:hover:text-orange-300'
                      )}>
                      <span>{getColumnHeaderText(column)}</span>
                      <Icon name='add' className='size-4' />
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {activeFiltersData.length > 0 ? (
              <div
                className={cn('space-y-3 p-2', {
                  'border-t border-dashed border-dark-gray/25 dark:border-zinc-800': availableColumns.length > 0
                })}>
                {activeFiltersData.map((filterData, columnIndex) => (
                  <div key={filterData.column.id}>
                    <div className='mb-2 flex items-center justify-between px-2 py-1'>
                      <div className='flex items-center space-x-2 text-sm font-medium'>
                        <Icon name='minus-square-fill' className='size-4 text-indigo-500 dark:text-indigo-400' />
                        <span className='font-okxs font-medium capitalize'>
                          {getColumnHeaderText(filterData.column)}
                        </span>
                      </div>
                      <BaseButton
                        onClick={() => handleColumnRemove(filterData.column.id)}
                        className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive'>
                        <Icon name='close' className='size-4' />
                      </BaseButton>
                    </div>

                    {filterData.uniqueValues.length > filterData.optionLimit ? (
                      <input
                        type='search'
                        value={optionQueries[filterData.column.id] ?? ''}
                        onChange={(event) => {
                          const query = event.target.value.slice(0, TABLE_QUERY_LIMITS.tokenCharacters)
                          setOptionQueries((current) => ({
                            ...current,
                            [filterData.column.id]: query
                          }))
                        }}
                        maxLength={TABLE_QUERY_LIMITS.tokenCharacters}
                        placeholder='Find a value'
                        aria-label={`Find ${getColumnHeaderText(filterData.column)} filter value`}
                        className='mb-2 h-8 w-full rounded-sm border border-neutral-500/20 bg-background px-2 font-brk text-xs outline-none'
                      />
                    ) : null}

                    <div className='max-h-40 overflow-y-auto scrollbar-gutter-[stable]'>
                      {(() => {
                        const query = optionQueries[filterData.column.id] ?? ''
                        const normalizedQuery = normalizeText(query)
                        const matchingOptions = normalizedQuery
                          ? filterData.uniqueValues.filter((option) => option.searchText.includes(normalizedQuery))
                          : filterData.uniqueValues
                        const renderedOptions = matchingOptions.slice(0, filterData.optionLimit)
                        const hiddenOptionCount = matchingOptions.length - renderedOptions.length

                        return (
                          <div className='space-y-1'>
                            {renderedOptions.map((option, index) => {
                              const id = `v-${baseId}-${columnIndex}-${index}`
                              const isChecked = filterData.selectedValues.some(
                                (selected) => getFilterValueToken(selected) === option.token
                              )

                              return (
                                <div
                                  key={option.token}
                                  className={cn(
                                    'ml-5 flex h-8 items-center rounded-sm px-1.5 font-brk hover:bg-dark-table/10 dark:hover:bg-origin/30',
                                    {
                                      'bg-indigo-500 text-white opacity-100 hover:bg-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-400/15':
                                        isChecked
                                    }
                                  )}>
                                  <Checkbox.Root
                                    id={id}
                                    checked={isChecked}
                                    aria-label={`${isChecked ? 'Remove' : 'Add'} ${option.label} filter`}
                                    className='mr-2 flex size-4 shrink-0 items-center justify-center rounded-sm'
                                    onCheckedChange={(checked) => {
                                      const nextFilterValue = [...filterData.selectedValues]

                                      if (checked) {
                                        const exists = nextFilterValue.some(
                                          (value) => getFilterValueToken(value) === option.token
                                        )
                                        if (!exists) {
                                          nextFilterValue.push(option.token)
                                        }
                                      } else {
                                        const nextIndex = nextFilterValue.findIndex(
                                          (value) => getFilterValueToken(value) === option.token
                                        )
                                        if (nextIndex > -1) {
                                          nextFilterValue.splice(nextIndex, 1)
                                        }
                                      }

                                      filterData.column.setFilterValue(
                                        nextFilterValue.length > 0 ? nextFilterValue : undefined
                                      )
                                    }}>
                                    <Icon name={isChecked ? 'check' : 'checkbox-unchecked'} className='size-4' />
                                  </Checkbox.Root>
                                  <label htmlFor={id} className='flex grow justify-between gap-2 font-brk text-xs'>
                                    <span className='truncate'>{smap[option.label]}</span>
                                    <span className='shrink-0 text-xs'>{option.count}</span>
                                  </label>
                                </div>
                              )
                            })}
                            {hiddenOptionCount > 0 ? (
                              <div className='px-2 py-1 text-center font-brk text-[10px] text-muted-foreground'>
                                {hiddenOptionCount} more value
                                {hiddenOptionCount === 1 ? '' : 's'} — refine the search
                              </div>
                            ) : null}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={cn('px-2 py-3 text-center font-brk text-xs opacity-60', {
                  'border-t border-dashed border-dark-gray/25 dark:border-zinc-800': availableColumns.length > 0
                })}>
                no active filters
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

FilterComponent.displayName = 'Filter'

export const Filter = memo(FilterComponent) as typeof FilterComponent
