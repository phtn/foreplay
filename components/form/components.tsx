'use client'

import { Icon } from '@/lib/icons'
import { Button } from '../ui/button'
import { useFormContext } from './ctx'

interface SubmitButtonProps {
  label: string
  kind?: 'email' | 'default'
}

export function SubmitButton({ label, kind = 'default' }: SubmitButtonProps) {
  const formApi = useFormContext()
  return (
    <formApi.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          type='submit'
          size='xl'
          className='relative z-2 w-full rounded-sm bg-linear-to-r from-primary/5 via-primary to-emerald-800/20 font-medium text-white sm:w-1/2'
          disabled={isSubmitting}>
          {kind === 'email' ? (
            <>
              Logging in...
              <Icon name='spinner-ring' className='ml-2 size-4' />
            </>
          ) : (
            label
          )}
        </Button>
      )}
    </formApi.Subscribe>
  )
}
