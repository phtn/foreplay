import { cn } from '@/lib/utils'
import { type ClassName } from '@/types'
import { type HTMLAttributes, ReactNode } from 'react'
import { Card } from '../ui/card'

interface HyperCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className: ClassName
  light?: boolean
}

export const HyperWrap = ({ children, className }: HyperCardProps) => {
  return (
    <Card
      className={cn(
        'relative p-0 md:rounded-sm rounded-xs',
        'group bg-background dark:bg-sidebar/50 overflow-hidden',
        'md:border border-zinc-300 dark:border-zinc-800',
        className
      )}>
      {children}
    </Card>
  )
}
