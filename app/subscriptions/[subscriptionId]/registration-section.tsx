'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { createSubscriptionRegistration } from './registration-actions'

const shirtSizeOptions = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

const formControlClassName =
  'h-10 border-border/70 bg-background/70 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/15'

type RegistrationSectionProps = {
  defaultDivision?: string
  maxEntries: number
  registrations: Doc<'registrations'>[]
  subscriptionId: Id<'subscriptions'>
}

type DraftRegistration = {
  division: string
  handicapIndex: string
  playerEmail: string
  playerName: string
  playerPhone: string
  shirtSize: string
}

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
  maxEntries,
  registrations,
  subscriptionId
}: RegistrationSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftRegistration>(() => buildInitialDraft(defaultDivision))

  const registrationLimit = Math.max(1, maxEntries)
  const remainingSlots = Math.max(0, registrationLimit - registrations.length)
  const canAddMore = remainingSlots > 0

  const registrationCards = useMemo(
    () =>
      registrations.map((registration, index) => ({
        id: registration._id,
        slotLabel: `Player ${index + 1}`,
        name: registration.player_name,
        email: registration.player_email ?? 'No email',
        phone: registration.player_phone ?? 'No phone',
        division: registration.division ?? 'No division',
        handicap: registration.handicap_index ?? 'No handicap',
        shirtSize: registration.shirt_size
      })),
    [registrations]
  )

  const resetDraft = () => {
    setDraft(buildInitialDraft(defaultDivision))
  }

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

  return (
    <Card className='border-border/70'>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1.5'>
            <CardTitle className='flex items-center space-x-3 font-okx text-lg'>
              <span>Register Players</span>
              <Button
                size='icon-xs'
                className='rounded-full bg-foreground'
                onClick={() => {
                  setErrorMessage(null)
                  setIsAdding(true)
                }}>
                <Icon name={isPending ? 'spinner-ring' : 'add'} />
              </Button>
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Add one player form at a time until all {registrationLimit} entry slots are assigned.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <span className='inline-flex rounded-md bg-muted px-3 py-1.5 font-ios text-xs uppercase tracking-widest text-muted-foreground'>
              {registrations.length}/{registrationLimit} saved
            </span>
            <span className='inline-flex rounded-md bg-sky-500/5 px-3 py-1.5 font-ios text-xs uppercase tracking-widest text-sky-600'>
              {remainingSlots} open
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-5'>
        {registrationCards.length ? (
          <div className='grid gap-4 md:grid-cols-2'>
            {registrationCards.map((registration) => (
              <div key={registration.id} className='rounded-2xl border border-border/60 bg-muted/20 p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>
                      {registration.slotLabel}
                    </p>
                    <p className='mt-2 font-okx text-base text-foreground/90'>{registration.name}</p>
                  </div>
                  <span className='inline-flex rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground/75'>
                    {registration.shirtSize}
                  </span>
                </div>

                <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                  <RegistrationField label='Email' value={registration.email} />
                  <RegistrationField label='Phone' value={registration.phone} />
                  <RegistrationField label='Division' value={registration.division} />
                  <RegistrationField label='Handicap' value={registration.handicap} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/10 p-6 text-center'>
            <Icon name='person-multiple' className='size-8 text-muted-foreground/60' />
            <div className='space-y-1'>
              <p className='font-okx text-base'>No players registered yet</p>
              <p className='text-sm text-muted-foreground'>Start assigning the entry slots to individual players.</p>
            </div>
          </div>
        )}

        {errorMessage ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {errorMessage}
          </div>
        ) : null}

        {isAdding ? (
          <div className='rounded-2xl border border-border/70 bg-muted/10 p-5'>
            <div className='grid gap-4 md:grid-cols-2'>
              <RegistrationInput
                id='player-name'
                label='Player name'
                required
                value={draft.playerName}
                onChange={(value) => setDraft((current) => ({ ...current, playerName: value }))}
              />
              <RegistrationInput
                id='player-email'
                label='Email'
                type='email'
                value={draft.playerEmail}
                onChange={(value) => setDraft((current) => ({ ...current, playerEmail: value }))}
              />
              <RegistrationInput
                id='player-phone'
                label='Phone'
                type='tel'
                value={draft.playerPhone}
                onChange={(value) => setDraft((current) => ({ ...current, playerPhone: value }))}
              />
              <RegistrationInput
                id='player-handicap'
                label='Handicap'
                value={draft.handicapIndex}
                onChange={(value) => setDraft((current) => ({ ...current, handicapIndex: value }))}
              />
              <RegistrationInput
                id='player-division'
                label='Division'
                value={draft.division}
                onChange={(value) => setDraft((current) => ({ ...current, division: value }))}
              />
              <div className='space-y-2'>
                <Label htmlFor='player-shirt-size' className='text-xs uppercase tracking-widest text-muted-foreground'>
                  Shirt size
                </Label>
                <select
                  id='player-shirt-size'
                  value={draft.shirtSize}
                  onChange={(event) => setDraft((current) => ({ ...current, shirtSize: event.target.value }))}
                  disabled={isPending}
                  className={cn(
                    'h-10 w-full rounded-lg border border-border/70 bg-background/70 px-3 text-sm outline-none transition-colors',
                    'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:opacity-60'
                  )}>
                  {shirtSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='mt-5 flex flex-wrap justify-end gap-3'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                disabled={isPending}
                onClick={() => {
                  setIsAdding(false)
                  setErrorMessage(null)
                  resetDraft()
                }}>
                Cancel
              </Button>
              <Button type='button' size='sm' disabled={isPending} onClick={handleSubmit}>
                {isPending ? 'Saving...' : 'Save player'}
              </Button>
            </div>
          </div>
        ) : canAddMore ? (
          <button
            type='button'
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-center gap-2')}
            onClick={() => {
              setErrorMessage(null)
              setIsAdding(true)
            }}>
            <Icon name='add' className='size-4' />
            Add player
          </button>
        ) : (
          <div className='rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300'>
            All entry slots already have player registrations.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RegistrationField({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1'>
      <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{label}</p>
      <p className='text-sm text-foreground/80'>{value}</p>
    </div>
  )
}

function RegistrationInput({
  id,
  label,
  onChange,
  required = false,
  type = 'text',
  value
}: {
  id: string
  label: string
  onChange: (value: string) => void
  required?: boolean
  type?: React.ComponentProps<typeof Input>['type']
  value: string
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
        className={formControlClassName}
      />
    </div>
  )
}
