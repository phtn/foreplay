'use client'

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type {LegalDocument} from '@/legal/documents'
import {cn} from '@/lib/utils'

interface TocDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  document: LegalDocument | undefined
  activeId?: string
}

export function TocDrawer({
  isOpen,
  onOpenChange,
  document: doc,
  activeId,
}: TocDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Table of Contents</DrawerTitle>
        </DrawerHeader>
        <nav className='space-y-2 px-4 pb-6 text-sm'>
          {doc?.headings?.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(heading.id)
                if (element) {
                  element.scrollIntoView({behavior: 'smooth', block: 'start'})
                }
                onOpenChange(false)
              }}
              className={cn(
                'block rounded px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                heading.level === 2 ? 'font-medium' : 'ml-4',
                heading.id === activeId &&
                  'bg-muted text-mac-blue dark:text-primary-hover',
              )}>
              {heading.text}
            </a>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}
