import { Toolbar } from '@base-ui/react/toolbar'
import { ReactNode } from 'react'

interface CenterTableToolbarProps {
  actions?: ReactNode
  filter: ReactNode
  view: ReactNode
  dateRange?: ReactNode
}

export const CenterTableToolbar = ({ actions, filter, view, dateRange }: CenterTableToolbarProps) => {
  return (
    <div className='flex h-9 shrink-0 items-center justify-center ps-2.5 md:ps-0'>
      <div className='flex items-start justify-start md:justify-between gap-4 shrink-0 md:gap-2'>
        <div className='shrink-0'>{view}</div>
        <div className='flex shrink-0 flex-nowrap items-start gap-4 md:gap-2'>
          <div className='shrink-0 flex'>{filter}</div>
          {dateRange ? <div className='shrink-0 hidden md:flex'>{dateRange}</div> : null}
          {actions ? <div className='flex shrink-0'>{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}

interface RightTableToolbarProps {
  left?: ReactNode
  search: ReactNode
}

export const RightTableToolbar = ({ left, search }: RightTableToolbarProps) => {
  return (
    <Toolbar.Root className='flex h-9 shrink-0 items-center justify-end gap-px overflow-visible'>
      <div className='flex shrink-0 items-center justify-end gap-1 md:gap-2'>
        {left}
        {search}
      </div>
    </Toolbar.Root>
  )
}

interface LeftTableToolbarProps {
  select: ReactNode
}

export const LeftTableToolbar = ({ select }: LeftTableToolbarProps) => {
  return (
    <Toolbar.Root className='relative flex h-9 shrink-0 items-start gap-px overflow-visible bg-transparent px-1.5 py-0.5'>
      <div className='relative flex items-center gap-2 bg-transparent md:gap-4'>{select}</div>
    </Toolbar.Root>
  )
}
