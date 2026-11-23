'use client'

import { RegistrationTicketCard } from '@/components/tickets/registration-ticket-card'
import { Button } from '@/components/ui/button'
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Id } from '@/convex/_generated/dataModel'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { specialEntryTypeLabels, type RegistrationTicketData, type SpecialEntryType } from '@/lib/tickets/registration-ticket'
import { useId, useRef, useState, type SubmitEvent } from 'react'
import { createSpecialEntry } from './actions'

export function SpecialEntryDrawer({ tournamentId }: { tournamentId: Id<'tournaments'> }) {
  const { user } = useFirebaseUser()
  const fieldId = useId()
  const requestIdRef = useRef<string | null>(null)
  const submitLock = useRef(false)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticket, setTicket] = useState<RegistrationTicketData | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitLock.current) return
    if (nextOpen) {
      requestIdRef.current = null
      setError(null)
      setTicket(null)
    }
    setOpen(nextOpen)
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitLock.current) return
    if (!user) {
      setError('Your admin session is still loading. Try again in a moment.')
      return
    }

    const form = new FormData(event.currentTarget)
    const guestName = String(form.get('guestName') ?? '').trim()
    if (!guestName) {
      setError('Enter the guest name.')
      event.currentTarget.querySelector<HTMLInputElement>('[name="guestName"]')?.focus()
      return
    }

    submitLock.current = true
    setSubmitting(true)
    setError(null)
    try {
      requestIdRef.current ??= crypto.randomUUID()
      const result = await createSpecialEntry({
        tournamentId,
        requestId: requestIdRef.current,
        entryType: form.get('entryType') as SpecialEntryType,
        guestName,
        contactEmail: String(form.get('contactEmail') ?? '').trim() || undefined,
        contactPhone: String(form.get('contactPhone') ?? '').trim() || undefined
      }, await user.getIdToken())
      if (!result.ok) {
        setError(result.error)
        return
      }
      setTicket(result.ticket)
    } catch {
      setError('Unable to create the entry. Try again.')
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection='right'>
      <DrawerTrigger render={<Button type='button' size='sm' />}>
        <Icon name='add' data-icon='inline-start' aria-hidden='true' />
        Add special entry
      </DrawerTrigger>
      <DrawerContent className='rounded-lg [--drawer-content-width:calc(100vw-1rem)] sm:[--drawer-content-width:44rem] lg:[--drawer-content-width:50rem]'>
        <DrawerHeader className='border-b border-border pb-4'>
          <DrawerTitle>{ticket ? 'Special entry added' : 'Add special entry'}</DrawerTitle>
          <DrawerDescription>
            {ticket ? 'The ticket is ready to download.' : 'Create an active ticket for one guest. No payment is required.'}
          </DrawerDescription>
        </DrawerHeader>
        {ticket ? (
          <div className='min-h-0 overflow-y-auto p-4 sm:p-6'>
            <p role='status' className='sr-only'>Special entry added. The ticket is ready to download.</p>
            <RegistrationTicketCard registration={ticket} onExportError={setError} />
            {error ? <p role='alert' className='mt-3 text-sm text-destructive'>{error}</p> : null}
            <div className='mt-4 flex justify-end'>
              <DrawerClose render={<Button type='button' variant='outline' />}>Close</DrawerClose>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='flex min-h-0 flex-1 flex-col overflow-y-auto'>
            <fieldset disabled={submitting} className='grid gap-4 p-4 sm:p-6'>
              <div className='grid gap-2'>
                <Label htmlFor={`${fieldId}-type`}>Entry type</Label>
                <select
                  className='h-11 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm'
                  id={`${fieldId}-type`}
                  name='entryType'
                  defaultValue='vip'
                  aria-describedby={`${fieldId}-type-help`}>
                  {Object.entries(specialEntryTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <p id={`${fieldId}-type-help`} className='text-sm text-muted-foreground'>
                  Non-playing entries include event access only.
                </p>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor={`${fieldId}-name`}>Guest name</Label>
                <Input className='h-11' id={`${fieldId}-name`} name='guestName' maxLength={120} required />
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='grid gap-2'>
                  <Label htmlFor={`${fieldId}-email`}>Email (optional)</Label>
                  <Input className='h-11' id={`${fieldId}-email`} name='contactEmail' type='email' maxLength={320} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor={`${fieldId}-phone`}>Phone (optional)</Label>
                  <Input className='h-11' id={`${fieldId}-phone`} name='contactPhone' type='tel' maxLength={64} />
                </div>
              </div>
              {error ? <p role='alert' className='text-sm text-destructive'>{error}</p> : null}
            </fieldset>
            <DrawerFooter className='flex-row justify-end'>
              <DrawerClose render={<Button type='button' variant='outline' disabled={submitting} />}>Cancel</DrawerClose>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Creating ticket…' : 'Create ticket'}
              </Button>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  )
}
