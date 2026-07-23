import { TableCell, TableRow } from '@/components/ui/table'
import { Icon } from '@/lib/icons'

interface EmptyTableProps {
  colSpan: number
  loading: boolean
}

export const EmptyTable = ({ colSpan, loading }: EmptyTableProps) => (
  <TableRow className='max-w-6xl'>
    <TableCell
      colSpan={Math.max(1, colSpan)}
      className='h-9 w-full text-center font-brk text-muted-foreground'>
      {loading ? (
        <div className='flex items-center justify-center gap-2 px-4'>
          <Icon name='spinner-ring' className='size-4' />
          <span>Loading...</span>
        </div>
      ) : (
        <span className='p-2'>No data.</span>
      )}
    </TableCell>
  </TableRow>
)
