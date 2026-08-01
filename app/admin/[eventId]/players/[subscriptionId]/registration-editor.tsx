'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState, useTransition } from 'react'
import { saveRegistrationDetails, type SaveRegistrationDetailsState } from './actions'

export type RegistrationEditorPlayer = {
  division: string
  handicapIndex: string
  playerEmail: string
  playerName: string
  playerPhone: string
  registrationId: string
  shirtSize: string
}

export type RegistrationEditorEntry = {
  contactEmail: string
  contactPhone: string
  division: string
  handicapIndex: string
  subscriptionId: string
  teamName: string
}

type RegistrationEditorProps = {
  divisionOptions: string[]
  entry: RegistrationEditorEntry
  eventId: string
  players: RegistrationEditorPlayer[]
}

const initialState: SaveRegistrationDetailsState = {
  message: '',
  status: 'idle'
}

const inputClassName =
  'h-11 border-border/70 bg-background shadow-none focus-visible:border-primary focus-visible:ring-primary/15'

export function RegistrationEditor({ divisionOptions, entry, eventId, players }: RegistrationEditorProps) {
  const router = useRouter()
  const { isLoading: isAuthLoading, user } = useFirebaseUser()
  const [state, setState] = useState(initialState)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setState(initialState)
    startTransition(async () => {
      if (!user) {
        setState({
          status: 'error',
          message: 'Your admin session is still loading. Try again in a moment.'
        })
        return
      }

      try {
        const firebaseIdToken = await user.getIdToken(true)
        const result = await saveRegistrationDetails(formData, firebaseIdToken)
        setState(result)

        if (result.status === 'success') {
          router.refresh()
        }
      } catch (error) {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to save registration details. Try again.'
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={isPending} className='space-y-5'>
      <input type='hidden' name='eventId' value={eventId} />
      <input type='hidden' name='subscriptionId' value={entry.subscriptionId} />

      <datalist id='admin-registration-divisions'>
        {divisionOptions.map((division) => (
          <option key={division} value={division} />
        ))}
      </datalist>

      <fieldset disabled={isPending} className='space-y-5'>
        <Card size='sm' className='gap-0 rounded-xl py-0'>
          <CardContent className='grid gap-4 py-5 md:grid-cols-2'>
            <EditorField
              id='registration-team-name'
              label='Player name'
              name='teamName'
              defaultValue={entry.teamName}
              maxLength={120}
              autoComplete='organization'
            />
            <EditorField
              id='registration-contact-email'
              label='Contact email'
              name='contactEmail'
              type='email'
              defaultValue={entry.contactEmail}
              maxLength={320}
              autoComplete='email'
              required
            />
            <EditorField
              id='registration-contact-phone'
              label='Contact phone'
              name='contactPhone'
              type='tel'
              defaultValue={entry.contactPhone}
              maxLength={64}
              autoComplete='tel'
            />
            <EditorField
              id='registration-handicap'
              label='Handicap index'
              name='handicapIndex'
              defaultValue={entry.handicapIndex}
              maxLength={64}
            />
            {/*<EditorField
              id='registration-division'
              label='Division'
              name='division'
              defaultValue={entry.division}
              maxLength={120}
              list='admin-registration-divisions'
            />*/}
          </CardContent>
        </Card>

        <section className='space-y-3' aria-labelledby='registered-players-title'>
          <div className='flex items-end justify-between gap-4 px-1'>
            <div>
              <h2 id='registered-players-title' className='font-okx text-base font-semibold'>
                Registered Player Info
              </h2>
              <p className='text-sm text-muted-foreground'>Player changes are reflected on their active ticket.</p>
            </div>
            <span className='shrink-0 font-ios text-xs uppercase tracking-widest text-muted-foreground'>
              {players.length} {players.length === 1 ? 'player' : 'players'}
            </span>
          </div>

          {players.length ? (
            <div className='grid gap-4'>
              {players.map((player, index) => {
                const prefix = `registration.${player.registrationId}`
                const idPrefix = `registration-${player.registrationId}`

                return (
                  <Card key={player.registrationId} size='sm' className='gap-0 rounded-xl py-0'>
                    <input type='hidden' name='registrationId' value={player.registrationId} />
                    <CardHeader className='flex flex-row items-center justify-between gap-4 border-b border-border/60 py-4'>
                      <div className='min-w-0'>
                        <CardTitle className='truncate font-okx text-base'>Player {index + 1}</CardTitle>
                        <CardDescription className='truncate'>{player.playerName}</CardDescription>
                      </div>
                      <span className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>
                        Ticket details
                      </span>
                    </CardHeader>
                    <CardContent className='grid gap-4 py-5 md:grid-cols-2 lg:grid-cols-3'>
                      <EditorField
                        id={`${idPrefix}-name`}
                        label='Player name'
                        name={`${prefix}.playerName`}
                        defaultValue={player.playerName}
                        maxLength={120}
                        autoComplete='name'
                        required
                      />
                      <EditorField
                        id={`${idPrefix}-email`}
                        label='Email'
                        name={`${prefix}.playerEmail`}
                        type='email'
                        defaultValue={player.playerEmail}
                        maxLength={320}
                        autoComplete='email'
                      />
                      <EditorField
                        id={`${idPrefix}-phone`}
                        label='Phone'
                        name={`${prefix}.playerPhone`}
                        type='tel'
                        defaultValue={player.playerPhone}
                        maxLength={64}
                        autoComplete='tel'
                      />
                      <EditorField
                        id={`${idPrefix}-handicap`}
                        label='Handicap index'
                        name={`${prefix}.handicapIndex`}
                        defaultValue={player.handicapIndex}
                        maxLength={64}
                      />
                      <EditorField
                        id={`${idPrefix}-division`}
                        label='Division'
                        name={`${prefix}.division`}
                        defaultValue={player.division}
                        maxLength={120}
                        list='admin-registration-divisions'
                      />
                      <EditorField
                        id={`${idPrefix}-shirt-size`}
                        label='Shirt size'
                        name={`${prefix}.shirtSize`}
                        defaultValue={player.shirtSize}
                        maxLength={64}
                        required
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className='rounded-xl border border-dashed border-border bg-muted/10 px-5 py-10 text-center'>
              <Icon name='person-multiple' className='mx-auto mb-3 size-8 text-muted-foreground/50' />
              <p className='font-okx text-sm'>No individual players registered yet.</p>
              <p className='mt-1 text-xs text-muted-foreground'>
                You can still correct the entry contact details above.
              </p>
            </div>
          )}
        </section>

        <div className='sticky bottom-3 z-10 rounded-xl border border-border/70 bg-background/90 p-3 backdrop-blur-xl'>
          {state.status !== 'idle' ? (
            <p
              role={state.status === 'error' ? 'alert' : 'status'}
              className={cn(
                'mb-3 rounded-lg px-3 py-2 text-sm',
                state.status === 'error'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              )}>
              {state.message}
            </p>
          ) : null}
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button type='reset' variant='ghost' disabled={isPending} className='sm:min-w-28'>
              Reset
            </Button>
            <Button
              type='submit'
              disabled={isPending || isAuthLoading || !user}
              className='gap-2 text-white sm:min-w-40'>
              <Icon name={isPending ? 'spinner-ring' : 'check'} className='size-4' />
              {isPending ? 'Saving changes' : 'Save changes'}
            </Button>
          </div>
        </div>
      </fieldset>
    </form>
  )
}

function EditorField({
  id,
  label,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  id: string
  label: string
}) {
  return (
    <div className='grid min-w-0 gap-2'>
      <Label htmlFor={id} className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>
        {label}
      </Label>
      <Input id={id} className={cn(inputClassName, className)} {...props} />
    </div>
  )
}
