import { cn } from '@/lib/utils'
import { flexRender, type Cell } from '@tanstack/react-table'
import { TableCell } from '../ui/table'

interface RenderCellProps<TData, TValue> {
  cell: Cell<TData, TValue>
  isEditing: boolean
  isVisible: boolean
}

export const RenderCell = <TData, TValue>({
  cell,
  isEditing,
  isVisible
}: RenderCellProps<TData, TValue>) => {
  return (
    <TableCell
      aria-hidden={isVisible ? undefined : true}
      data-column-visible={isVisible}
      inert={!isVisible}
      className={cn(
        'overflow-hidden p-0 [&:last-child>div]:py-0',
        !isVisible && 'pointer-events-none',
        isEditing && 'dark:bg-background/10'
      )}>
      <div
        className={cn(
          'min-w-0 overflow-hidden p-3 transition-opacity duration-150 ease-out motion-reduce:transition-none',
          isVisible ? 'opacity-100 delay-75' : 'opacity-0 delay-0'
        )}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    </TableCell>
  )
}
