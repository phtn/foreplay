'use client'

import { cn } from '@/lib/utils'
import { Icon, type IconName } from '@/lib/icons'
import { type ClassName } from '@/types'
import { Tabs as Root } from '@base-ui/react/tabs'
import { useQueryState } from 'nuqs'
import { type ReactNode } from 'react'

interface TabsProps {
  tabs: Tab[]
  className?: ClassName
}

export interface Tab {
  value: string
  label: string
  icon: IconName
  content?: ReactNode
}

export const Tabs = ({ tabs, className }: TabsProps) => {
  const defaultValue = tabs[1]?.value ?? tabs[0]?.value ?? null
  const [value, setValue] = useQueryState('tab', {
    history: 'push',
    scroll: false,
    shallow: true
  })
  const activeValue = value !== null && tabs.some((tab) => tab.value === value) ? value : defaultValue

  return (
    <Root.Root
      className={cn(className, 'rounded-none')}
      value={activeValue}
      onValueChange={(nextValue) => {
        const validValue =
          typeof nextValue === 'string' && tabs.some((tab) => tab.value === nextValue) ? nextValue : defaultValue
        void setValue(validValue)
      }}>
      <Root.List className='relative z-0 grid grid-cols-7 gap-1 px-3 sm:px-4 md:gap-2'>
        {tabs.map((tab) => (
          <Root.Tab
            key={tab.value}
            className={cn(
              'group relative flex h-11 min-w-0 cursor-pointer items-center justify-center rounded-md px-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-active:text-background md:px-2'
            )}
            value={tab.value}>
            <Icon name={tab.icon} className='size-5 md:hidden' />
            <span className='sr-only md:not-sr-only'>{tab.label}</span>
          </Root.Tab>
        ))}

        <Root.Indicator
          className={cn(
            'absolute top-1/2 left-0 z-[-1] h-10 w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-md bg-foreground/90 transition-all duration-250 ease-in-out'
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
