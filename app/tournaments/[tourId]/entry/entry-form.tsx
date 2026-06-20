'use client'

import { useAppForm } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { useState } from 'react'
import { createTournamentSubscription } from './actions'

const entryControlClassName =
  'h-9 bg-input/40 hover:bg-input/40 focus-visible:bg-input/30 border-border/40 pr-3 py-1 font-ios text-foreground/80 text-sm shadow-none dark:bg-input/20 dark:hover:bg-input/20 dark:focus-visible:bg-input/20 dark:border-white/20'

type DivisionOption = {
  label: string
  value: string
}

interface NewEntryFormProps {
  tourId: string
  formId: string
  players: number
  division: string
  initialEmail: string
  initialPhone: string
  divisionOptions: DivisionOption[]
  onPlayersChange: (nextPlayers: number) => void
  onDivisionChange: (nextDivision: string) => void
}

export const NewEntryForm = ({
  tourId,
  formId,
  players,
  division,
  initialEmail,
  initialPhone,
  divisionOptions,
  onPlayersChange,
  onDivisionChange
}: NewEntryFormProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useAppForm({
    defaultValues: {
      fullName: '',
      email: initialEmail,
      phone: initialPhone,
      division,
      playerCount: String(players),
      handicapIndex: ''
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)
      setSuccessMessage(null)

      try {
        const result = await createTournamentSubscription({
          tourId,
          formId,
          teamName: value.fullName,
          email: value.email,
          phone: value.phone,
          playerCount: value.playerCount,
          handicapIndex: value.handicapIndex,
          division: value.division
        })

        setSuccessMessage(`Entry request saved. Subscription ${result.subscriptionId} is pending payment review.`)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to save this entry request.')
      }
    }
  })
  const isSubmitting = form.state.isSubmitting
  const isSaved = successMessage !== null

  return (
    <form.AppForm>
      <form
        className='grid md:grid-cols-3'
        aria-busy={isSubmitting}
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}>
        <div className='border-r border-slate-400 dark:border-slate-800 p-8'>
          <form.AppField name='fullName'>
            {({ TextField }) => (
              <TextField
                id='name'
                type='text'
                label='Team Name (Optional)'
                icon={'pentagon'}
                placeholder='Team A'
                autoComplete='organization'
                containerClassName='mb-4'
                className={entryControlClassName}
                disabled={isSubmitting || isSaved}></TextField>
            )}
          </form.AppField>
          <form.AppField name='email'>
            {({ TextField }) => (
              <TextField
                id='book-email'
                label='Contact'
                icon='mail'
                type='email'
                placeholder='you@example.com'
                autoComplete='email'
                required
                containerClassName='mb-4'
                className={entryControlClassName}
                disabled={isSubmitting || isSaved}></TextField>
            )}
          </form.AppField>
          <form.AppField name='phone'>
            {({ TextField }) => (
              <TextField
                id='book-phone'
                type='tel'
                // label='Phone'
                icon='phone-accept'
                placeholder='+63'
                autoComplete='tel'
                required
                containerClassName='mb-0'
                className={entryControlClassName}
                disabled={isSubmitting || isSaved}
              />
            )}
          </form.AppField>
        </div>

        <div className='bg-sky-500/0 p-8 border-r border-slate-400 dark:border-slate-800'>
          <form.AppField name='playerCount'>
            {({ TextField }) => (
              <TextField
                id='book-players'
                label='Number of Entries'
                type='number'
                icon='person-multiple'
                min='1'
                max='4'
                required
                containerClassName='mb-4'
                className={entryControlClassName}
                disabled={isSubmitting || isSaved}
                onChange={(event) => {
                  const nextPlayers = Number.parseInt(event.currentTarget.value, 10)
                  onPlayersChange(Number.isNaN(nextPlayers) ? players : nextPlayers)
                }}>
                <div>
                  <Icon name='add-circle' className='opacity-70' />
                </div>
              </TextField>
            )}
          </form.AppField>
          {/*<div className='h-28 bg-slate-100 rounded-md'></div>*/}
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
            <form.AppField name='division'>
              {({ SelectField }) => (
                <SelectField
                  id='book-division'
                  label='Division'
                  options={divisionOptions}
                  containerClassName='mb-0'
                  disabled={isSubmitting || isSaved}
                  onChange={(event) => {
                    onDivisionChange(event.currentTarget.value)
                  }}
                />
              )}
            </form.AppField>
            <form.AppField name='handicapIndex'>
              {({ TextField }) => (
                <TextField
                  id='book-handicap'
                  type='number'
                  icon='golf-flag'
                  label='Handicap'
                  placeholder='Optional'
                  containerClassName='mb-0'
                  className={entryControlClassName}
                  disabled={isSubmitting || isSaved}
                />
              )}
            </form.AppField>
          </div>
        </div>

        <div className='h-full flex flex-col gap-14 pt-4 text-center md:justify-center bg-sky-500/0'>
          <p className='font-okx text-foreground/80 text-base text-balance text-center'>
            By continuing, you reserve a request for <span className='px-2 font-medium'>{tourId}</span>. Confirmation
            follows payment review.
          </p>
          {errorMessage ? (
            <p role='alert' className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p role='status' className='rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'>
              {successMessage}
            </p>
          ) : null}
          <div className='flex items-center justify-center w-full'>
            <Button
              size='2xl'
              type='submit'
              variant='default'
              className='w-full bg-slate-900 dark:bg-background text-white/80 md:w-auto md:min-w-64'
              disabled={isSubmitting || isSaved}>
              {isSubmitting ? <Icon name='spinner-ring' className='size-4' /> : null}
              <span className='px-2 font-poly capitalize'>{isSaved ? 'Saved' : 'Submit Entries'}</span>
            </Button>
          </div>
        </div>
      </form>
    </form.AppForm>
  )
}
