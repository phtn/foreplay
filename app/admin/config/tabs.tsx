'use client'

import { cn } from '@/lib/utils'
import { type ClassName } from '@/types'
import { Tabs as Root } from '@base-ui/react/tabs'
import { type ReactNode, useState } from 'react'

interface TabsProps {
  tabs: Tab[]
  className?: ClassName
}

export interface Tab {
  value: string
  label: ReactNode
  content?: ReactNode
}

export const Tabs = ({ tabs, className }: TabsProps) => {
  const firstValue = tabs[1]?.value ?? null
  const [value, setValue] = useState<string | null>(firstValue)
  const activeValue = value !== null && tabs.some((tab) => tab.value === value) ? value : firstValue

  return (
    <Root.Root
      className={cn(className, 'rounded-md')}
      value={activeValue}
      onValueChange={(nextValue) => setValue(typeof nextValue === 'string' ? nextValue : firstValue)}>
      <Root.List className='relative z-0 flex gap-3 md:gap-4 px-2'>
        {tabs.map((tab, index) => (
          <Root.Tab
            key={tab.value}
            className={cn(
              `transition-colors duration-250 ease-in-out group cursor-pointer`,
              `flex h-6 items-center justify-center border-0 px-1.5 md:px-2.5 text-sm font-normal break-keep whitespace-nowrap text-foreground/60 outline-hidden select-none before:inset-x-0 before:inset-y-1 before:rounded-xs before:outline-blue-800/0 hover:text-foreground hover:data-active:text-orange-100 dark:hover:data-active:text-background focus-visible:relative focus-visible:before:absolute focus-visible:before:outline-2 data-active:text-background ${index === 0 ? 'first:ml-1' : ''}`,
              {
                'text-lg w-6 rounded-full bg-slate-500/8':
                  tab.value === 'settings' || tab.value === 'messaging' || tab.value === 'create-event'
              }
            )}
            value={tab.value}>
            {tab.label}
          </Root.Tab>
        ))}

        <Root.Indicator
          className={cn(
            'absolute top-1/2 left-0 z-[-1] h-6 w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-[4.1px] bg-foreground/90 transition-all duration-250 ease-in-out',
            {
              'rounded-full':
                activeValue === 'settings' || activeValue === 'messaging' || activeValue === 'create-event'
            }
          )}
        />
      </Root.List>
      <section className='min-h-64 mt-4'>
        {tabs.map((tab) => (
          <Root.Panel key={tab.value} className='h-fit' value={tab.value}>
            {tab?.content}
          </Root.Panel>
        ))}
      </section>
    </Root.Root>
  )
}
