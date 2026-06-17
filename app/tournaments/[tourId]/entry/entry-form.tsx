'use client'

import { useAppForm } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'

const divisionOptions = [{ label: 'Pro', value: 'Pro' }]
const entryControlClassName =
  'h-9 bg-input/40 hover:bg-input/40 focus-visible:bg-input/30 border-border/40 pr-3 py-1 font-ios text-foreground/80 text-sm shadow-none dark:bg-input/20 dark:hover:bg-input/20 dark:focus-visible:bg-input/20 dark:border-white/20'

interface NewEntryFormProps {
  tourId: string
  formId: string
  players: number
  division: string
  onPlayersChange: (nextPlayers: number) => void
  onDivisionChange: (nextDivision: string) => void
}

export const NewEntryForm = ({
  tourId,
  formId,
  players,
  division,
  onPlayersChange,
  onDivisionChange
}: NewEntryFormProps) => {
  const form = useAppForm({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      division,
      playerCount: String(players),
      handicapIndex: ''
    },
    onSubmit: async () => {}
  })

  return (
    <form.AppForm>
      <form
        className='grid grid-cols-3 gap-8 bg-white/5 px-4 pt-8'
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}>
        <div className=''>
          <form.AppField name='fullName'>
            {({ TextField }) => (
              <TextField
                id='name'
                type='text'
                label='Group / Team Name'
                icon={'pentagon'}
                placeholder='Team A'
                autoComplete='tel'
                required
                containerClassName='mb-4'
                className={entryControlClassName}></TextField>
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
                className={entryControlClassName}></TextField>
            )}
          </form.AppField>
          <form.AppField name='phone'>
            {({ TextField }) => (
              <TextField
                id='book-phone'
                type='tel'
                // label='Phone'
                icon='phone-accept'
                placeholder='+63 9xx xxx xxxx'
                autoComplete='tel'
                required
                containerClassName='mb-4'
                className={entryControlClassName}
              />
            )}
          </form.AppField>
        </div>

        <div className=''>
          <form.AppField name='playerCount'>
            {({ TextField }) => (
              <TextField
                id='book-players'
                label='Players'
                type='number'
                icon='person-multiple'
                min='1'
                max='4'
                required
                containerClassName='mb-4'
                className={entryControlClassName}
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
          <div className='h-28 bg-slate-100 rounded-md'></div>
          <div className='hidden _flex items-center space-x-4 mt-6'>
            <form.AppField name='division'>
              {({ SelectField }) => (
                <SelectField
                  id='book-division'
                  label='Division'
                  options={divisionOptions}
                  containerClassName='mb-0'
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
                />
              )}
            </form.AppField>
          </div>
        </div>

        <div className='flex flex-wrap items-center justify-end gap-6 pt-4'>
          <p className='text-sm text-muted-foreground text-center'>
            By continuing, you reserve a request for <span className='px-2 font-medium'>{tourId}</span>. Confirmation
            follows payment review.
          </p>
          <div className='flex flex-wrap gap-3 w-full'>
            <Button size='xl' type='submit' variant='default' className='bg-sky-500' disabled={form.state.isSubmitting}>
              <span className='px-2 font-medium uppercase'>{formId}</span>
            </Button>
          </div>
        </div>
      </form>
    </form.AppForm>
  )
}
