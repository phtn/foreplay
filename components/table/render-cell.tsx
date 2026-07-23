import { cn } from '@/lib/utils'
import { flexRender, type Cell } from '@tanstack/react-table'
import { TableCell } from '../ui/table'

interface RenderCellProps<TData, TValue> {
  cell: Cell<TData, TValue>
  isEditing: boolean
}

export const RenderCell = <TData, TValue>({
  cell,
  isEditing
}: RenderCellProps<TData, TValue>) => {
  const cellSize = cell.column.getSize()

  return (
    <TableCell
      style={{
        width: cellSize,
        minWidth: cellSize,
        maxWidth: cellSize
      }}
      className={cn(
        'overflow-hidden last:py-0',
        isEditing && 'dark:bg-background/10'
      )}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}
