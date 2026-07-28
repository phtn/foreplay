'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

type StartingHoleProps = {
  disabled?: boolean
  onChangeAction: (value: string) => void
  startingHoleCounts: Readonly<Record<string, number>>
  value: string
}

const startingHoles = Array.from({ length: 18 }, (_, index) => String(index + 1))

export function StartSelector({ disabled, onChangeAction, startingHoleCounts, value }: StartingHoleProps) {
  const [open, setOpen] = useState(false)
  const hasStartingHole = startingHoles.includes(value)

  const selectHole = (hole: string) => {
    onChangeAction(hole === value ? '' : hole)
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
                'font-poly font-semibold text-sm md:text-base tabular-nums bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 text-foreground',
                hasStartingHole && 'bg-primary dark:bg-primary text-white hover:bg-primary/80 border-primary'
              )}
            />
          }>
          {value || <Icon name='flag-tri' className='size-3.5 opacity-80' />}
        </PopoverTrigger>
        <PopoverContent className='w-4xs flex items-center gap-4 p-0 border dark:border-zinc-600' align='end'>
          <div className='grid grid-cols-3 gap-1 p-2'>
            {startingHoles.map((hole) => {
              const assignedPlayerCount = startingHoleCounts[hole] ?? 0
              const selected = value === hole

              return (
                <Button
                  key={hole}
                  type='button'
                  variant='secondary'
                  size='icon'
                  aria-label={`Start hole ${hole}, ${assignedPlayerCount} ${
                    assignedPlayerCount === 1 ? 'player' : 'players'
                  } assigned${selected ? ', selected' : ''}`}
                  aria-pressed={selected}
                  className={cn(
                    'relative group flex h-12 w-12 aspect-square items-center justify-center gap-1 rounded-lg font-poly text-sm font-semibold tabular-nums transition-colors duration-200',
                    selected
                      ? 'bg-primary/70 dark:bg-primary/50 dark:text-white text-white'
                      : 'bg-slate-100 dark:bg-slate-400/5 hover:bg-primary/50 hover:text-white dark:text-primary dark:hover:bg-primary/30'
                  )}
                  onClick={() => selectHole(hole)}>
                  <span>{hole}</span>
                  {assignedPlayerCount > 0 ? (
                    <div
                      aria-hidden='true'
                      className={cn(
                        'absolute bottom-0 right-0 h-3 max-w-3 flex items-center justify-center rounded-[3.5px] px-1 font-okx text-[9px] font-medium leading-none tabular-nums',
                        selected ? 'bg-white text-zinc-700' : 'bg-white text-zinc-700 dark:text-zinc-700'
                      )}>
                      {assignedPlayerCount}
                    </div>
                  ) : null}
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
