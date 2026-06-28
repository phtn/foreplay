'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

type StartingHoleProps = {
  disabled?: boolean
  onChangeAction: (value: string) => void
  value: string
}

const startingHoles = Array.from({ length: 18 }, (_, index) => String(index + 1))

export function StartSelector({ disabled, onChangeAction, value }: StartingHoleProps) {
  const [open, setOpen] = useState(false)
  const hasStartingHole = startingHoles.includes(value)

  const selectHole = (hole: string) => {
    onChangeAction(hole)
    setOpen(false)
  }

  return (
    <div className='flex items-center justify-center'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              size='icon-sm'
              variant='default'
              disabled={disabled}
              className={cn(
                'font-poly font-semibold text-sm md:text-base tabular-nums bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-foreground',
                hasStartingHole && 'bg-primary dark:bg-primary text-white hover:bg-primary/80 border-primary'
              )}
            />
          }>
          {value || <Icon name='flag-tri' className='size-3.5 opacity-80' />}
        </PopoverTrigger>
        <PopoverContent className='w-4xs flex items-center gap-4 p-0 border' align='end'>
          <div className='grid grid-cols-3 gap-1 p-2'>
            {startingHoles.map((hole) => (
              <Button
                key={hole}
                type='button'
                variant='secondary'
                size='icon'
                className={cn(
                  'flex h-12 w-12 aspect-square items-center justify-center rounded-lg font-poly text-sm font-semibold tabular-nums transition-colors',
                  value === hole
                    ? 'bg-primary/60 dark:bg-primary/70 dark:text-white text-primary-foreground'
                    : 'bg-slate-100 hover:bg-primary hover:text-white dark:hover:bg-primary'
                )}
                onClick={() => selectHole(hole)}>
                {hole}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
