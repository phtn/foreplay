import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import { ReactNode } from 'react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface HeaderProps {
  tip: ReactNode
  symbol?: ReactNode
  left?: boolean
  center?: boolean
  right?: boolean
  className?: ClassName
}

export const ColHeader = ({ tip, symbol, left = true, center = false, right = false, className }: HeaderProps) => (
  <Tooltip>
    <TooltipTrigger render={<Button variant='outline' className='w-fit' />}>{tip}</TooltipTrigger>
    <TooltipContent>
      <div
        className={cn(
          'w-full',
          {
            'text-left': left,
            'text-center': center,
            'text-right': right
          },
          className
        )}>
        {symbol}
      </div>
    </TooltipContent>
  </Tooltip>
)
