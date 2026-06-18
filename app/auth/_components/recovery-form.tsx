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
    <p className='text-center text-sm text-foreground'>
      If an account exists with that email, you&apos;ll receive a password reset link shortly.
    </p>
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
