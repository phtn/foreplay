'use client'

import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Button } from '@base-ui/react'
import { Menu } from '@base-ui/react/menu'
import type { Column, VisibilityState } from '@tanstack/react-table'
import { memo, useCallback, useMemo, type ComponentProps } from 'react'
import { getColumnHeaderText } from './filter-utils'

interface Props<T> {
  cols: Column<T, unknown>[]
  onColumnVisibilityChange?: (updater: VisibilityState | ((old: VisibilityState) => VisibilityState)) => void
}

const ColumnViewComponent = <T,>({ cols, onColumnVisibilityChange }: Props<T>) => {
  const hideableColumns = useMemo(() => cols.filter((column) => column.getCanHide()), [cols])
  const invisibleColumns = hideableColumns.filter((column) => !column.getIsVisible())

  const handleToggle = useCallback(
    (columnId: string, nextVisible: boolean) => {
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange((old) => ({
          ...old,
          [columnId]: nextVisible
        }))
        return
      }

      hideableColumns.find((column) => column.id === columnId)?.toggleVisibility(nextVisible)
    },
    [hideableColumns, onColumnVisibilityChange]
  )

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            className={cn(
              'relative flex h-8 grow-0 items-center justify-center rounded-sm px-2 text-sm transition-colors duration-75 select-none portrait:aspect-square md:h-7.5 md:w-auto md:space-x-2 md:px-3.5',
              'data-pressed:bg-neutral-200 dark:data-pressed:bg-sidebar',
              'bg-sidebar/50 dark:bg-dark-table/10',
              'hover:bg-sidebar/60 dark:hover:bg-dark-table/50',
              'active:bg-sidebar dark:active:bg-dark-table/20',
              'focus-visible:bg-none focus-visible:-outline-offset-1 focus-visible:outline-1',
              invisibleColumns.length > 0 && 'px-0 md:px-3.5'
            )}>
            {invisibleColumns.length > 0 ? (
              <span className='min-w-3.5 w-5 grow-0 rounded-sm bg-orange-500 font-okx font-semibold text-white dark:text-background md:-ml-1 dark:bg-orange-300'>
                {invisibleColumns.length > 99 ? '99+' : invisibleColumns.length}
              </span>
            ) : (
              <Icon name='selector-vertical' className='size-4 dark:opacity-80' />
            )}
            <span className='hidden font-ios text-sm opacity-90 md:flex'>Columns</span>
          </Button>
        }>
        <ChevronDownIcon className='-mr-1' />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align='start' className='outline-none' sideOffset={2}>
          <Menu.Popup className='origin-(--transform-origin) w-64 rounded-xl border border-dark-gray/30 bg-sidebar py-1 text-origin shadow-none outline-gray-200 transition-[transform,scale,opacity] data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0 dark:bg-dark-table dark:text-zinc-200'>
            <div className='flex items-center border-b border-dashed border-dark-gray/25 px-4 py-1 capitalize dark:border-zinc-800'>
              <span className='font-okx text-sm font-medium'>Toggle columns</span>
            </div>
            <div className='p-2 space-y-1'>
              {hideableColumns.map((column) => (
                <Menu.CheckboxItem
                  key={column.id}
                  className={cn(
                    'flex h-8 items-center justify-between rounded-sm bg-orange-300 dark:bg-orange-300/10 px-3 text-xs text-origin hover:bg-orange-300/10 dark:hover:bg-orange-300/15 dark:hover:text-orange-200',
                    column.getIsVisible() && 'bg-transparent not-italic opacity-100 dark:bg-transparent dark:text-white'
                  )}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => handleToggle(column.id, value === true)}
                  onSelect={(event) => event.preventDefault()}>
                  <span>{getColumnHeaderText(column)}</span>
                  <Icon name={column.getIsVisible() ? 'check' : 'eye-close'} className='size-4' />
                </Menu.CheckboxItem>
              ))}
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

ColumnViewComponent.displayName = 'ColumnView'

export const ColumnView = memo(ColumnViewComponent) as typeof ColumnViewComponent

function ChevronDownIcon(props: ComponentProps<'svg'>) {
  return (
    <svg width='10' height='10' viewBox='0 0 10 10' fill='none' {...props}>
      <path d='M1 3.5L5 7.5L9 3.5' stroke='currentcolor' strokeWidth='1.5' />
    </svg>
  )
}
