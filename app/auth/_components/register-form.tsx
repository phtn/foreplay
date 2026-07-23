'use client'

import { useAppForm } from '@/components/form'
import { Button } from '@/components/ui/button'
import {
  getFirebaseAuthErrorMessage,
  registerWithEmailPassword,
  signInWithGoogle,
  useFirebaseUser
} from '@/lib/firebase/auth'
import { createFirebaseSession } from '@/lib/firebase/session'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { User } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthDivider } from './auth-divider'
import { AuthErrorMessage } from './auth-error-message'

type SubmissionKind = 'email' | 'google' | null

async function syncFirebaseSession(user: User) {
  await createFirebaseSession(await user.getIdToken(true))
}

export function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submissionKind, setSubmissionKind] = useState<SubmissionKind>(null)
  const { user, isLoading: isAuthLoading } = useFirebaseUser()
  const router = useRouter()

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)

      if (value.password !== value.confirmPassword) {
        setErrorMessage('Passwords do not match.')
        return
      }

      setSubmissionKind('email')

      try {
        const credential = await registerWithEmailPassword(value.email, value.password)
        await syncFirebaseSession(credential.user)
        router.replace(redirectTo)
      } catch (error) {
        setErrorMessage(getFirebaseAuthErrorMessage(error))
        setSubmissionKind(null)
      }
    }
  })

  const isSubmitting = submissionKind !== null || form.state.isSubmitting
  const googleButtonLabel =
    submissionKind === 'google'
      ? user
        ? 'Checking session...'
        : 'Connecting...'
      : user
        ? 'Go to Dashboard'
        : 'Continue with Google'

  async function handleGoogle() {
    setErrorMessage(null)
    setSubmissionKind('google')

    try {
      const nextUser = user ?? (await signInWithGoogle()).user
      await syncFirebaseSession(nextUser)
      router.replace(redirectTo)
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error))
      setSubmissionKind(null)
    }
  }

  return (
    <>
      <div className='flex items-center gap-2 md:gap-4 mb-6'>
        <Button
          type='button'
          className={cn(
            'h-12 w-full gap-3 rounded-md border border-foreground/40 bg-white/80 px-4 text-sm font-medium transition-colors hover:border-primary hover:bg-white dark:border-white/55 dark:bg-white/30 dark:hover:border-white dark:hover:bg-white/25 disabled:pointer-events-none disabled:opacity-70 sm:col-span-1',
            { 'disabled:opacity-100': isAuthLoading }
          )}
          onClick={handleGoogle}
          disabled={isSubmitting || isAuthLoading}>
          <Icon
            name={submissionKind === 'google' ? 'spinner-ring' : 'goog'}
            className={cn('size-4 text-foreground', { 'size-4': isAuthLoading })}
          />
          <span className='dark:text-white text-foreground/60 font-sans'>{googleButtonLabel}</span>
        </Button>
      </div>
      <AuthDivider />
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
                label='Email'
                icon='mail'
                type='email'
                autoComplete='email'
                autoFocus
                placeholder='you@example.com'
                required
                disabled={isSubmitting || isAuthLoading}
              />
            )}
          </form.AppField>
          <form.AppField name='password'>
            {(field) => (
              <field.TextField
                id='password'
                label='Password'
                icon='lock'
                type='password'
                autoComplete='new-password'
                placeholder='••••••••'
                minLength={6}
                required
                disabled={isSubmitting || isAuthLoading}
              />
            )}
          </form.AppField>
          <form.AppField name='confirmPassword'>
            {(field) => (
              <field.TextField
                id='confirm-password'
                label='Confirm Password'
                icon='lock'
                type='password'
                autoComplete='new-password'
                placeholder='••••••••'
                minLength={6}
                required
                disabled={isSubmitting || isAuthLoading}
              />
            )}
          </form.AppField>
          <Button type='submit' className='h-12 w-full font-medium text-white' disabled={isSubmitting || isAuthLoading}>
            {submissionKind === 'email' ? (
              <>
                <Icon name='spinner-ring' className='mr-2 size-4' />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </form.AppForm>
    </>
  )
}
