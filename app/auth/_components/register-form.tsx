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
import type { User } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthDivider } from './auth-divider'
import { AuthErrorMessage } from './auth-error-message'

type SubmissionKind = 'email' | 'google' | null

async function syncFirebaseSession(user: User) {
  await createFirebaseSession(await user.getIdToken(true))
}

export function RegisterForm() {
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
        router.replace('/')
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
        ? 'Continue to dashboard'
        : 'Continue with Google'

  async function handleGoogle() {
    setErrorMessage(null)
    setSubmissionKind('google')

    try {
      const nextUser = user ?? (await signInWithGoogle()).user
      await syncFirebaseSession(nextUser)
      router.replace('/')
    } catch (error) {
      setErrorMessage(getFirebaseAuthErrorMessage(error))
      setSubmissionKind(null)
    }
  }

  return (
    <>
      <Button
        variant='outline'
        className='mb-5 h-12 w-full gap-4 text-sm font-medium xl:mb-6'
        onClick={handleGoogle}
        disabled={isSubmitting || isAuthLoading}>
        <Icon name={submissionKind === 'google' ? 'spinner-ring' : 'goog'} className='size-3.5' />
        <span>{googleButtonLabel}</span>
      </Button>

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
          <Button type='submit' className='h-12 w-full font-medium' disabled={isSubmitting || isAuthLoading}>
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
