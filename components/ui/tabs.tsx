'use client'

import { Icon, type IconName } from '@/lib/icons'
import { Tabs as Root } from '@base-ui/react/tabs'
import { ReactNode, useState } from 'react'

interface TabsProps {
  tabs: Tab[]
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  className?: string
}

export interface Tab {
  value: string
  label: string
  icon: IconName
  content?: ReactNode
}

export const Tabs = ({ tabs, defaultValue, onValueChange, className }: TabsProps) => {
  const firstValue = tabs[0]?.value ?? null
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? firstValue)
  const activeValue =
    internalValue !== null && tabs.some((tab) => tab.value === internalValue) ? internalValue : firstValue

  return (
    <Root.Root
      className={className}
      defaultValue={activeValue}
      onValueChange={(nextValue) => {
        const next = typeof nextValue === 'string' ? nextValue : firstValue

        setInternalValue(next)
        onValueChange?.(next ?? firstValue ?? '')
      }}>
      <Root.List className='relative z-0 flex gap-4'>
        {tabs.map((tab) => (
          <Root.Tab
            key={tab.value}
            className={`flex items-center gap-2 px-3 py-1 text-sm font-medium ${
              activeValue === tab.value ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
            }`}
            // className={`flex h-7 items-center justify-center border-0 px-2 text-sm font-normal break-keep whitespace-nowrap text-foreground/60 outline-hidden select-none before:inset-x-0 before:inset-y-1 before:rounded-xs before:-outline-offset-1 before:outline-blue-800 hover:text-foreground hover:data-active:text-orange-100 dark:hover:data-active:text-background focus-visible:relative focus-visible:before:absolute focus-visible:before:outline-2 data-active:text-background ${index === 0 ? 'first:ml-1' : ''}`}
            value={tab.value}>
            <Icon name={tab.icon} className='size-4 opacity-80' />
            <span>{tab.label}</span>
          </Root.Tab>
        ))}

        <Root.Indicator
          renderBeforeHydration
          className='absolute top-1/2 left-0 z-[-1] h-6 w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-lg bg-accent/25 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]'
        />
      </Root.List>
      {/*<section className='min-h-64 mt-4'>
        {tabs.map((tab) => (
          <Root.Panel key={tab.value} className='h-fit' value={tab.value}>
            {tab?.content}
          </Root.Panel>
        ))}
      </section>*/}
    </Root.Root>
  )
}
