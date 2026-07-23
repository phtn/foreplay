import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { CoreHeader, Renderable, SortDirection } from '@tanstack/react-table'
import { memo, type JSX, type ReactNode } from 'react'

interface Props<TData, TValue> {
  header: CoreHeader<TData, TValue>
  flexRender: <T extends object>(Comp: Renderable<T>, props: T) => ReactNode | JSX.Element
  sorted: SortDirection | false
}
const ColumnSortComponent = <TData, TValue>({ header, flexRender, sorted }: Props<TData, TValue>) => {
  const handleSort = () => {
    if (!header.column.getCanSort()) return
    header.column.toggleSorting(undefined, false)
  }

  return header.isPlaceholder ? null : header.column.getCanSort() ? (
    <button
      type='button'
      className={cn('relative flex h-full w-full cursor-pointer items-center gap-1.5 text-left select-none')}
      onClick={handleSort}
      aria-label={`Sort by ${header.column.id}${sorted ? `, currently ${sorted === 'asc' ? 'ascending' : 'descending'}` : ''}`}>
      {flexRender(header.column.columnDef.header, header.getContext())}
      {sorted === 'asc' ? (
        <Icon
          aria-hidden='true'
          name='chevron-right'
          className='absolute -rotate-45 right-0 size-3 shrink-0 text-teal-700 dark:text-teal-500 dark:opacity-90'
        />
      ) : sorted === 'desc' ? (
        <Icon
          aria-hidden='true'
          name='chevron-right'
          className='absolute rotate-45 right-0 size-3 shrink-0 dark:text-orange-500 text-orange-700 dark:opacity-90'
        />
      ) : null}
    </button>
  ) : (
    flexRender(header.column.columnDef.header, header.getContext())
  )
}

ColumnSortComponent.displayName = 'ColumnSort'

export const ColumnSort = memo(ColumnSortComponent) as typeof ColumnSortComponent
