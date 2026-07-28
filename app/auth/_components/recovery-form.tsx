'use client'

import { useAppForm } from '@/components/form'
import { Button } from '@/components/ui/button'
import { getFirebaseAuthErrorMessage, isFirebaseAuthError, sendPasswordReset } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { useState } from 'react'
import { AuthErrorMessage } from './auth-error-message'

export function RecoveryForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const form = useAppForm({
    defaultValues: {
      email: ''
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)

      try {
        await sendPasswordReset(value.email)
        setSent(true)
      } catch (error) {
        if (isFirebaseAuthError(error, 'auth/user-not-found')) {
          setSent(true)
        } else {
          setErrorMessage(getFirebaseAuthErrorMessage(error))
        }
      }
    }
  })

  const isSubmitting = form.state.isSubmitting

  return sent ? (
    <div className='space-y-5'>
      <div role='status' className='flex flex-col items-center text-center'>
        <span className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <Icon name='mail' className='size-5' />
        </span>
        <h2 className='mt-4 font-poly text-xl text-foreground'>Check your email</h2>
        <p className='mt-2 max-w-sm text-sm leading-6 text-muted-foreground text-balance'>
          If an account exists with that email, you&apos;ll receive a password reset link shortly.
        </p>
      </div>

      <div className='rounded-xl border border-border/60 bg-muted/25 p-4'>
        <p className='font-okx text-sm font-medium text-foreground'>Can&apos;t find the email?</p>
        <ul className='mt-3 list-disc space-y-2 pl-5 text-sm leading-5 text-muted-foreground'>
          <li>Check your spam, junk, or promotions folder.</li>
          <li>Allow a few minutes for the message to arrive.</li>
          <li>If you request another reset, use the newest link because older links may no longer work.</li>
        </ul>
      </div>

      <Button
        type='button'
        variant='outline'
        className='h-12 w-full font-medium'
        onClick={() => {
          setErrorMessage(null)
          setSent(false)
        }}>
        Try another email
      </Button>
    </div>
  ) : (
    <>
      <AuthErrorMessage message={errorMessage} />

      <form.AppForm>
        <form
          aria-busy={isSubmitting}
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}>
          <form.AppField name='email'>
            {(field) => (
              <field.TextField
                id='email'
                label='Email address'
                icon='mail'
                type='email'
                autoComplete='email'
                autoFocus
                placeholder='you@example.com'
                required
                disabled={isSubmitting}
              />
            )}
          </form.AppField>
          <Button type='submit' className='h-12 w-full font-medium' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Icon name='spinner-ring' className='mr-2 size-4' />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      </form.AppForm>
    </>
  )
}
