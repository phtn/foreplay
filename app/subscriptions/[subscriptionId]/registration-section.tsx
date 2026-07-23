'use client'

import { RegistrationTicketCard } from '@/components/tickets/registration-ticket-card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Id } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { createPngFilename, downloadElementAsPng } from '@/lib/tickets/download-ticket-png'
import { toRegistrationTicketData } from '@/lib/tickets/registration-ticket'
import { cn } from '@/lib/utils'
import type { ClassName } from '@/types'
import { useRouter } from 'next/navigation'
import { Activity, useCallback, useMemo, useRef, useState, useTransition } from 'react'
import type { DraftRegistration, RegistrationSectionProps } from '../types'
import { createSubscriptionRegistration, deleteSubscriptionRegistration } from './registration-actions'

const formControlClassName =
  'h-10 border-border/70 bg-background/70 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/15'

function buildInitialDraft(defaultDivision?: string): DraftRegistration {
  return {
    playerName: '',
    playerEmail: '',
    playerPhone: '',
    handicapIndex: '',
    division: defaultDivision ?? '',
    shirtSize: 'M'
  }
}

export function RegistrationSection({
  defaultDivision,
  eventDate,
  maxEntries,
  registrations,
  subscriptionId,
  tournamentName,
  venue
}: RegistrationSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null)
  const [isExportingAll, setIsExportingAll] = useState(false)
  const [deletingRegistrationId, setDeletingRegistrationId] = useState<Id<'registrations'> | null>(null)
  const [draft, setDraft] = useState<DraftRegistration>(() => buildInitialDraft(defaultDivision))
  const ticketsRef = useRef<HTMLDivElement>(null)
  const exportAllLockRef = useRef(false)

  const registrationLimit = Math.max(1, maxEntries)
  const remainingSlots = Math.max(0, registrationLimit - registrations.length)
  const canAddMore = remainingSlots > 0

  const registrationCards = useMemo(
    () =>
      registrations.map((registration, index) =>
        toRegistrationTicketData(registration, `Player ${index + 1}`, {
          eventDate,
          eventName: tournamentName,
          venue
        })
      ),
    [eventDate, registrations, tournamentName, venue]
  )

  const resetDraft = () => {
    setDraft(buildInitialDraft(defaultDivision))
  }

  const handleDownloadAllTickets = useCallback(async () => {
    if (!ticketsRef.current || exportAllLockRef.current) {
      return
    }

    setExportErrorMessage(null)
    exportAllLockRef.current = true
    setIsExportingAll(true)

    try {
      await downloadElementAsPng(
        ticketsRef.current,
        createPngFilename(`foreplay-tickets-${subscriptionId}`, 'foreplay-tickets')
      )
    } catch (error) {
      console.error('Unable to export all ticket PNGs.', error)
      setExportErrorMessage('Unable to download the tickets. Please try again.')
    } finally {
      exportAllLockRef.current = false
      setIsExportingAll(false)
    }
  }, [subscriptionId])

  const handleSubmit = () => {
    if (!draft.playerName.trim()) {
      setErrorMessage('Player name is required.')
      return
    }

    setErrorMessage(null)

    startTransition(async () => {
      try {
        await createSubscriptionRegistration({
          subscriptionId,
          playerName: draft.playerName,
          playerEmail: draft.playerEmail || undefined,
          playerPhone: draft.playerPhone || undefined,
          handicapIndex: draft.handicapIndex || undefined,
          division: draft.division || undefined,
          shirtSize: draft.shirtSize
        })

        setIsAdding(false)
        resetDraft()
        router.refresh()
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to save this player registration.')
      }
    })
  }

  const handleDelete = (registrationId: Id<'registrations'>, playerName: string) => {
    if (!window.confirm(`Delete ${playerName}'s registration?`)) {
      return
    }

    setErrorMessage(null)
    setDeletingRegistrationId(registrationId)

    startTransition(async () => {
      try {
        await deleteSubscriptionRegistration({
          registrationId,
          subscriptionId
        })

        setIsAdding(false)
        resetDraft()
        router.refresh()
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to delete this player registration.')
      } finally {
        setDeletingRegistrationId(null)
      }
    })
  }

  return (
    <Card className='rounded-xl gap-y-0 p-0 outline-none border-none'>
      <CardHeader className='px-4 sm:px-4 py-3 border bg-slate-400/20'>
        <div className='flex gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1.5 w-full'>
            <CardTitle className='flex items-center gap-3 font-okx text-lg'>
              <span>Ticket Registry</span>
              <Activity mode={canAddMore ? 'visible' : 'hidden'}>
                <Button
                  size='icon-xs'
                  className='rounded-full bg-foreground dark:bg-sky-400'
                  disabled={isAdding || isPending}
                  aria-label='Add player'
                  onClick={() => {
                    setErrorMessage(null)
                    setIsAdding(true)
                  }}>
                  <Icon name={isPending ? 'spinner-ring' : 'add'} className='size-4' />
                </Button>
              </Activity>
            </CardTitle>
          </div>

          <div className='flex items-center gap-1 md:gap-2'>
            <Activity mode={registrationCards.length ? 'visible' : 'hidden'}>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='size-8 px-0 sm:w-auto sm:px-3'
                disabled={isExportingAll}
                aria-label='Download ticket as PNG'
                title='Download ticket as PNG'
                onClick={() => {
                  void handleDownloadAllTickets()
                }}>
                <Icon name={isExportingAll ? 'spinner-ring' : 'down-to-line'} className='size-4' />
                <span className='hidden sm:inline'>download</span>
              </Button>
            </Activity>
            <span className='inline-flex rounded-md bg-muted px-3 py-1.5 font-ios text-xs uppercase md:tracking-widest text-foreground whitespace-nowrap'>
              {registrations.length}/{registrationLimit} saved
            </span>
            <Activity mode={remainingSlots > 0 ? 'visible' : 'hidden'}>
              <span className='inline-flex rounded-md bg-sky-500/5 dark:bg-sky-100/10 px-3 py-1.5 font-ios text-xs uppercase md:tracking-widest text-sky-600 dark:text-sky-200 whitespace-nowrap'>
                {remainingSlots} open
              </span>
            </Activity>
          </div>
        </div>
        <p className='text-sm text-foreground/60'>Add player&apos;s details to register and secure the slot.</p>
      </CardHeader>

      <CardContent className='space-y-0 py-0 px-0 border-x border-b rounded-b-xl bg-white'>
        {registrationCards.length ? (
          <div ref={ticketsRef} className='grid min-h-40! w-full gap-4 bg-white p-2 sm:p-4'>
            {registrationCards.map((registration) => (
              <RegistrationTicketCard
                key={registration.id}
                deletePending={deletingRegistrationId === registration.id}
                exportDisabled={isPending || isExportingAll}
                onDelete={handleDelete}
                onExportError={setExportErrorMessage}
                registration={registration}
              />
            ))}
          </div>
        ) : !isAdding && !isPending ? (
          <div className='flex min-h-40 flex-col items-center justify-center gap-3 rounded-none border-b border-dashed border-border/70 bg-muted/10 p-5 text-center sm:p-6'>
            <Icon name='ticket' className='size-10 text-sky-500/60 -rotate-10' />
            <div className='space-y-1'>
              <p className='font-okx text-neutral-600 text-base'>Register and print your entry ticket.</p>
              <p className='text-sm text-neutral-500'>Start assigning the entry slots to individual players.</p>
            </div>
          </div>
        ) : isAdding ? (
          <div className=''></div>
        ) : (
          <div className='flex items-center justify-center w-full h-40'>
            <Icon name='spinner-blocks' className='size-8 text-muted-foreground/60' />
          </div>
        )}

        <Activity mode={errorMessage ? 'visible' : 'hidden'}>
          <div className='rounded-xs border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {errorMessage}
          </div>
        </Activity>

        <Activity mode={exportErrorMessage ? 'visible' : 'hidden'}>
          <div
            role='alert'
            className='rounded-xs border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {exportErrorMessage}
          </div>
        </Activity>

        {isAdding ? (
          <div className='rounded-none _border border-border/70 bg-muted/10 p-4 sm:p-5'>
            <div className='grid gap-4 md:grid-cols-2'>
              <RegistrationInput
                id='player-name'
                label='Player name'
                required
                value={draft.playerName}
                onChange={(value) => setDraft((current) => ({ ...current, playerName: value }))}
                className='dark:bg-neutral-300 dark:focus-within:bg-neutral-200 dark:border-neutral-400'
              />
              <RegistrationInput
                id='player-email'
                label='Email'
                type='email'
                value={draft.playerEmail}
                onChange={(value) => setDraft((current) => ({ ...current, playerEmail: value }))}
                className='dark:bg-neutral-300 dark:focus-within:bg-neutral-200 dark:border-neutral-400'
              />
              <RegistrationInput
                id='player-phone'
                label='Phone (optional)'
                type='tel'
                value={draft.playerPhone}
                onChange={(value) => setDraft((current) => ({ ...current, playerPhone: value }))}
                className='dark:bg-neutral-300 dark:focus-within:bg-neutral-200 dark:border-neutral-400'
              />
            </div>

            <div className='mt-5 grid gap-3 sm:flex sm:flex-wrap sm:justify-end'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='w-full sm:w-auto h-10 dark:bg-neutral-300 font-poly text-neutral-500'
                disabled={isPending}
                onClick={() => {
                  setIsAdding(false)
                  setErrorMessage(null)
                  resetDraft()
                }}>
                Cancel
              </Button>
              <Button
                type='button'
                size='sm'
                className='w-full sm:w-auto h-10 font-poly text-white bg-neutral-900'
                disabled={isPending}
                onClick={handleSubmit}>
                {isPending ? 'Saving...' : 'Save player'}
              </Button>
            </div>
          </div>
        ) : canAddMore ? (
          <Button
            size='xl'
            type='button'
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'w-full justify-center gap-2 bg-neutral-900 text-white h-12 mt-0 rounded-xl'
            )}
            onClick={() => {
              setErrorMessage(null)
              setIsAdding(true)
            }}>
            <Icon name='add' className='size-4' />
            Add player
          </Button>
        ) : (
          <div className='font-okx font-medium flex items-center space-x-2 rounded-b-xl border dark:text-emerald-600 border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700'>
            <Icon name='checkbox-checked' className='size-4.5' />
            <span>Valid Ticket Registration</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RegistrationInput({
  id,
  label,
  onChange,
  required = false,
  type = 'text',
  value,
  className
}: {
  id: string
  label: string
  onChange: (value: string) => void
  required?: boolean
  type?: React.ComponentProps<typeof Input>['type']
  value: string
  className?: ClassName
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={id} className='text-xs uppercase tracking-widest text-muted-foreground'>
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(formControlClassName, className)}
      />
    </div>
  )
}
