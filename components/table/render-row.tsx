import { cn } from '@/lib/utils'
import type { Row } from '@tanstack/react-table'
import { memo, type MouseEvent } from 'react'
import { TableRow } from '../ui/table'
import { RenderCell } from './render-cell'

interface RenderRowProps<T> {
  row: Row<T>
  isActive: boolean
  isEditing: boolean
  isPinned: boolean
  isSelected: boolean
  showSelectColumn: boolean
  /** Forces a render (without remounting) when the visible cell set changes. */
  visibleColumnSignature: string
}

const RenderRowInner = <T,>({
  row,
  isActive,
  isEditing,
  isPinned,
  isSelected,
  showSelectColumn,
  visibleColumnSignature
}: RenderRowProps<T>) => {
  // Read the signature so React Compiler and future refactors retain this
  // deliberate invalidation dependency.
  void visibleColumnSignature

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target

    if (
      target instanceof HTMLElement &&
      target.closest(
        'button, input, select, textarea, a, [role="button"], [role="menuitem"]'
      )
    ) {
      return
    }

    if (showSelectColumn && row.getCanSelect()) {
      row.toggleSelected()
    }
  }

  const isHighlighted = isEditing || isActive

  return (
    <TableRow
      data-state={isSelected ? 'selected' : undefined}
      className={cn(
        'group/row h-10 border-y border-y-dotted border-y-dark-table/10 bg-sidebar/5 text-foreground transition-colors duration-75 hover:border-y-dark-table/30 hover:bg-sidebar active:bg-background/20 dark:border-greyed dark:border-y-dark-table/40 dark:hover:bg-background/80',
        {
          'last:rounded-tr-2xl dark:bg-blue-200/50': isHighlighted,
          'border-y-dark-table/30 bg-sidebar hover:bg-sidebar last:rounded-tr-2xl dark:bg-mac-blue/20':
            isSelected && !isHighlighted,
          'border-y-light-gray bg-sky-300/20 hover:bg-brand/10 dark:border-y-sky-300/15 dark:bg-background/20 dark:hover:bg-background/30':
            isPinned && !isHighlighted && !isSelected,
          'cursor-pointer': showSelectColumn && row.getCanSelect()
        }
      )}
      onClick={handleRowClick}>
      {row.getVisibleCells().map((cell) => (
        <RenderCell
          key={cell.id}
          cell={cell}
          isEditing={isSelected || showSelectColumn || isHighlighted}
        />
      ))}
    </TableRow>
  )
}

RenderRowInner.displayName = 'RenderRow'

export const RenderRow = memo(RenderRowInner) as typeof RenderRowInner
