'use client'

import { CreateQR } from '@/components/qrcode/creator'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
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

function buildGatePassPayload(registration: Pick<Doc<'registrations'>, '_id' | 'player_name' | 'player_email'>) {
  return JSON.stringify({
    id: registration._id.split(',').reverse().join(',').substring(12),
    name: registration.player_name
    // email: registration.player_email ?? ''
  })
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
        gatePassPayload: buildGatePassPayload(registration),
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
    <Card className='rounded-xl gap-y-0 p-0 outline-none border-none'>
      <CardHeader className='px-4 sm:px-4 py-3 border bg-slate-200/50'>
        <div className='flex gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1.5 w-full'>
            <CardTitle className='flex items-center gap-3 font-okx text-lg'>
              <span>Register Players</span>
              {canAddMore ? (
                <Button
                  size='icon-xs'
                  className='rounded-full bg-foreground'
                  disabled={isAdding || isPending}
                  aria-label='Add player'
                  onClick={() => {
                    setErrorMessage(null)
                    setIsAdding(true)
                  }}>
                  <Icon name={isPending ? 'spinner-ring' : 'add'} />
                </Button>
              ) : null}
            </CardTitle>
          </div>

          <div className='flex items-center gap-1 md:gap-2'>
            <span className='inline-flex rounded-md bg-muted px-3 py-1.5 font-ios text-xs uppercase md:tracking-widest text-muted-foreground whitespace-nowrap'>
              {registrations.length}/{registrationLimit} saved
            </span>
            <span className='inline-flex rounded-md bg-sky-500/5 px-3 py-1.5 font-ios text-xs uppercase md:tracking-widest text-sky-600 whitespace-nowrap'>
              {remainingSlots} open
            </span>
          </div>
        </div>
        <p className='text-sm text-foreground/60'>Add player&apos;s details to register and secure the slot.</p>
      </CardHeader>

      <CardContent className='space-y-0 py-0 px-0 border-x border-b rounded-b-xl bg-white'>
        {registrationCards.length ? (
          <div className='grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-slate-500 divide-dashed w-full'>
            {registrationCards.map((registration) => (
              <div key={registration.id} className='py-6 px-2'>
                <div className='grid gap-4 grid-cols-[1fr_auto] divide-x divide-slate-800/40 divide-dashed md:divide-x-0  sm:items-start ps-4 pe-2 md:px-2'>
                  <div className='min-w-0 space-y-4'>
                    <div className='flex items-start justify-between gap-4 sm:block'>
                      <div className='min-w-0'>
                        <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>
                          {registration.slotLabel}
                        </p>
                        <p className='mt-4 whitespace-nowrap font-ios font-medium text-lg text-foreground/90 dark:text-slate-900'>
                          {registration.name}
                        </p>
                      </div>
                    </div>

                    <div className='grid gap-3 grid-cols-1 overflow-hidden'>
                      <RegistrationField label='Email' value={registration.email} />
                      <RegistrationField label='Phone' value={registration.phone} />
                      <RegistrationField
                        label='Pass'
                        value={registration.id.split(',').reverse().join(',').substring(22).toUpperCase()}
                        className='font-ios font-semibold text-2xl tracking-[0.35em] line-through decoration-white'
                      />
                    </div>
                  </div>

                  {/*<p>{registration.gatePassPayload}</p>*/}

                  <CreateQR
                    config={{
                      text: registration.gatePassPayload,
                      radius: 0.36,
                      ecLevel: 'M',
                      fill: 'oklch(27.9% 0.041 260.031)',
                      background: null,
                      size: 200
                    }}
                  />
                  {/*<GatePassQRCode
                    content={registration.gatePassPayload}
                    label={registration.slotLabel}
                    shirtSize={registration.shirtSize}
                  />*/}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/10 p-5 text-center sm:p-6'>
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
          <div className='rounded-xl border border-border/70 bg-muted/10 p-4 sm:p-5'>
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

            <div className='mt-5 grid gap-3 sm:flex sm:flex-wrap sm:justify-end'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='w-full sm:w-auto'
                disabled={isPending}
                onClick={() => {
                  setIsAdding(false)
                  setErrorMessage(null)
                  resetDraft()
                }}>
                Cancel
              </Button>
              <Button type='button' size='sm' className='w-full sm:w-auto' disabled={isPending} onClick={handleSubmit}>
                {isPending ? 'Saving...' : 'Save player'}
              </Button>
            </div>
          </div>
        ) : canAddMore ? (
          <button
            type='button'
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full justify-center gap-2 hidden')}
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

interface RegistrationFieldProps {
  label: string
  value: string
  className?: ClassName
}
function RegistrationField({ label, value, className }: RegistrationFieldProps) {
  return (
    <div className='space-y-0.5'>
      <p className='font-ios font-medium text-[10px] uppercase tracking-widest text-foreground/80 dark:text-slate-500 italic'>
        {label}
      </p>
      <p
        className={cn(
          'font-ios tracking-[0.28em] text-sm text-foreground/80 dark:text-slate-800 max-w-[16ch]! text-clip',
          className
        )}>
        {value}
      </p>
    </div>
  )
}

// function GatePassQRCode({ content }: { content: string; label: string; shirtSize: string }) {
//   const qrOptions = useMemo<QRCodeOptions>(
//     () => ({
//       content,
//       width: 240,
//       height: 240,
//       padding: 1
//     }),
//     [content]
//   )

//   return (
//     <div className='p-0 w-64 relative flex items-center justify-center'>
//       <QRCodeSVG className='size-64 overflow-hidden [&_svg]:size-full' options={qrOptions} />
//       <div className='bg-[url("/som-optimized.svg")] bg-cover absolute top-0 z-90 w-54 h-54 opacity-40' />
//     </div>
//   )
// }

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
