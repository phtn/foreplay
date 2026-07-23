'use client'

import { RegistrationTicketCard } from '@/components/tickets/registration-ticket-card'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Icon } from '@/lib/icons'
import type { RegistrationTicketData } from '@/lib/tickets/registration-ticket'
import { useState } from 'react'

interface TicketViewerDrawerProps {
  active: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  reference: string
  tickets: RegistrationTicketData[]
}

export function TicketViewerDrawer({ active, onOpenChange, open, reference, tickets }: TicketViewerDrawerProps) {
  const [exportError, setExportError] = useState<string | null>(null)

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (nextOpen) setExportError(null)
      }}
      swipeDirection='down'>
      <DrawerContent className='[--drawer-content-width:calc(100vw-1rem)] sm:[--drawer-content-width:50rem]'>
        <DrawerHeader className='flex-row items-start justify-between gap-4 border-b border-border/60 pb-4 text-left'>
          <div className='min-w-0 space-y-1'>
            <DrawerTitle className='font-poly text-xl'>Ticket Viewer</DrawerTitle>
            <DrawerDescription className='truncate font-ios text-xs tracking-wider'>
              {reference} · {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </DrawerDescription>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            className='shrink-0 rounded-full'
            aria-label='Close ticket viewer'
            onClick={() => onOpenChange(false)}>
            <Icon name='close' className='size-4' />
          </Button>
        </DrawerHeader>

        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto bg-neutral-200 dark:bg-neutral-600 p-3 sm:p-4'>
          {!active ? (
            <div className='flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200'>
              <Icon name='lock' className='mt-0.5 size-4 shrink-0' />
              <span>Ticket downloads and gate entry remain disabled until payment is confirmed.</span>
            </div>
          ) : null}

          {exportError ? (
            <div
              role='alert'
              className='rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
              {exportError}
            </div>
          ) : null}

          {tickets.map((ticket) => (
            <RegistrationTicketCard
              key={ticket.id}
              isActive={active}
              onExportError={setExportError}
              registration={ticket}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
