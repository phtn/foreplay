import { Icon } from '@/lib/icons'
import { PaginationState } from '@tanstack/react-table'
import { memo, useId, useMemo } from 'react'
import { Button } from '../ui/button'

const DEFAULT_PAGE_SIZES = [10, 15, 25, 50, 100] as const

export interface PageControl {
  disabledNext: boolean
  disabledPrev: boolean
  gotoNext: VoidFunction
  gotoPrev: VoidFunction
  gotoFirst: VoidFunction
  gotoLast: VoidFunction
}

interface Props {
  state: PaginationState
  rowCount: number
  setPageSize: (v: string) => void
  pageControl: PageControl
}
const PaginatorComponent = ({
  state,
  rowCount,
  setPageSize,
  pageControl
}: Props) => {
  const id = useId()
  const pageCount = Math.max(1, Math.ceil(rowCount / state.pageSize))
  const currentPage = Math.min(state.pageIndex + 1, pageCount)
  const rangeStart =
    rowCount === 0
      ? 0
      : Math.min(state.pageIndex * state.pageSize + 1, rowCount)
  const rangeEnd = Math.min(
    state.pageIndex * state.pageSize + state.pageSize,
    rowCount
  )
  const pageSizeOptions = useMemo(() => {
    const current = state.pageSize
    const inDefaults = DEFAULT_PAGE_SIZES.some((s) => s === current)
    return inDefaults ? [...DEFAULT_PAGE_SIZES] : [...DEFAULT_PAGE_SIZES, current].sort((a, b) => a - b)
  }, [state.pageSize])

  return (
    <div className='flex flex-1 grow-0 flex-wrap items-center justify-between gap-2 border-t bg-linear-to-r from-transparent via-sidebar to-transparent px-2 py-2 md:mt-0 md:flex-nowrap md:px-0 md:pb-4 md:pt-1'>
      {/* Results per page */}
      <div className='flex min-w-0 items-center gap-2 md:w-fit md:justify-between md:gap-8 md:px-6'>
        <div className='font-clash tracking-tight text-sm md:text-base'>
          <span className='font-medium'>{rowCount}</span>
          <span className='opacity-80 ml-1 font-ios tracking-tighter'>items</span>
        </div>
        <div className='flex w-fit items-center rounded-lg py-1.5 dark:hover:bg-background/10 dark:focus-visible:bg-background/15 md:space-x-1 md:px-3'>
          <label htmlFor={id} className='font-okxs tracking-tight md:mx-auto flex items-center'>
            <select
              id={id}
              value={state.pageSize.toString()}
              onChange={(event) => {
                setPageSize(event.target.value)
              }}
              aria-label='Rows per page'
              className='min-h-0 bg-transparent md:h-auto py-1 md:px-2 border-none shadow-none min-w-20 whitespace-nowrap font-clash font-medium outline-none'>
              {pageSizeOptions.map((size) => (
                <option key={size.toString()} value={size.toString()}>
                  {size}
                </option>
              ))}
            </select>
            <span className='opacity-80 font-ios text-sm md:text-base mr-2'>rows</span>
          </label>
        </div>
      </div>
      {/* Page number information */}
      <div className='flex grow justify-end px-2 text-sm whitespace-nowrap text-muted-foreground md:px-4'>
        <p className='text-muted-foreground text-sm whitespace-nowrap' aria-live='polite'>
          <span className='text-foreground'>
            {rangeStart}-{rangeEnd}
          </span>{' '}
          of <span className='text-foreground'>{rowCount}</span>
          <span className='hidden md:inline'>
            {' '}
            · page {currentPage} of {pageCount}
          </span>
        </p>
      </div>

      {/* Pagination buttons */}
      <div className='flex items-center gap-2 md:gap-3 md:px-4'>
        <Button
          variant='secondary'
          size='icon'
          onClick={pageControl.gotoPrev}
          disabled={pageControl.disabledPrev}
          className='aspect-square rounded-md size-8 aria-disabled:pointer-events-none aria-disabled:opacity-30 dark:bg-sidebar disabled:bg-transparent'
          aria-label='Go to previous page'>
          <Icon name='chevron-right' className='size-4 m-auto -rotate-180' />
        </Button>
        <Button
          variant='secondary'
          size='icon'
          onClick={pageControl.gotoNext}
          disabled={pageControl.disabledNext}
          className='aspect-square rounded-md size-8 aria-disabled:pointer-events-none aria-disabled:opacity-30 dark:bg-sidebar disabled:bg-transparent'
          aria-label='Go to next page'>
          <Icon name='chevron-right' className='size-4 m-auto' />
        </Button>
      </div>
    </div>
  )
}

PaginatorComponent.displayName = 'Paginator'

export const Paginator = memo(PaginatorComponent)

// const SelectRows = () => (
//   <Select
//           name={'rows'}
//           onValueChange={(value) => item.validators?.onChange(value)}>
//           <SelectTrigger
//             size='default'
//             className='min-h-14 h-fit py-4 md:py-4 cursor-pointer rounded-2xl dark:bg-background/25 bg-background border-[0.33px] border-gray-500/50 outline-none text-left w-full'>
//             <SelectValue
//               placeholder={item.placeholder ?? 'Select an option'}
//               className='text-neutral-200 h-full placeholder:text-base'
//             />
//           </SelectTrigger>
//           <SelectContent className='w-full rounded-2xl border-gray-400 [&_*[role=option]]:ps-3 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-4'>
//             <HyperList
//               data={item.options}
//               component={SelectFieldItem}
//               itemStyle='border-b border-origin/0 last:border-none'
//               keyId='value'
//             />
//           </SelectContent>
//         </Select>
// )
