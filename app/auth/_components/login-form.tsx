'use client'

import { useAppForm } from '@/components/form'
import { Button } from '@/components/ui/button'
import {
  getFirebaseAuthErrorMessage,
  signInWithEmailPassword,
  signInWithGoogle,
  useFirebaseUser
} from '@/lib/firebase/auth'
import { createFirebaseSession } from '@/lib/firebase/session'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { User } from 'firebase/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthDivider } from './auth-divider'
import { AuthErrorMessage } from './auth-error-message'

type SubmissionKind = 'email' | 'google' | null
async function syncFirebaseSession(user: User) {
  await createFirebaseSession(await user.getIdToken(true))
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submissionKind, setSubmissionKind] = useState<SubmissionKind>(null)
  const { user, isLoading: isAuthLoading } = useFirebaseUser()
  const router = useRouter()

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: ''
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)
      setSubmissionKind('email')

      try {
        const credential = await signInWithEmailPassword(value.email, value.password)
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
        ? 'Authenticating'
        : 'Connecting'
      : user
        ? 'Go to Dashboard'
        : ' Continue with Google'

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
        <Button
          type='button'
          className='hidden size-12 aspect-square flex-1 gap-2 rounded-md border border-white/55 bg-white/80 px-4 text-sm font-medium hover:border-primary hover:bg-white dark:border-white/55 dark:bg-white/30 dark:hover:border-white dark:hover:bg-white/25 dark:disabled:border-white/30 dark:disabled:bg-transparent disabled:pointer-events-none disabled:opacity-60'
          disabled>
          <Icon name={'x'} className='size-4.5 text-foreground' />
        </Button>
        <Button
          type='button'
          className='hidden size-12 aspect-square flex-1 rounded-md border border-white/55 bg-white/80 px-4 text-sm font-medium hover:border-primary hover:bg-white dark:border-white/55 dark:bg-white/30 dark:hover:border-white dark:hover:bg-white/25 dark:disabled:border-white/30 dark:disabled:bg-transparent disabled:pointer-events-none disabled:opacity-60'
          disabled>
          <Icon name={'github'} className='size-8 text-foreground' />
        </Button>
        <Button
          type='button'
          className='hidden size-12 aspect-square flex-1 gap-3 rounded-md border border-white/55 bg-white/80 px-4 text-sm font-medium hover:border-primary hover:bg-white dark:border-white/55 dark:bg-white/30 dark:hover:border-white dark:hover:bg-white/25 dark:disabled:border-white/30 dark:disabled:bg-transparent disabled:pointer-events-none disabled:opacity-60'
          disabled>
          <Icon name={'msft'} className='size-4.5 text-foreground' />
        </Button>
      </div>

      <AuthDivider />

      <AuthErrorMessage message={errorMessage} />

      <form.AppForm>
        <form
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
                placeholder='user@website.com'
                autoFocus
                required
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
                placeholder='Enter your password'
                required></field.TextField>
            )}
          </form.AppField>
          <div className='flex flex-col-reverse gap-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex w-full items-center gap-0'>
              <Link
                href='/auth/recovery'
                className='flex items-center space-x-1 text-xs md:text-sm text-emerald-800 dark:text-foreground/80 hover:underline decoration-primary underline-offset-4 focus-visible:outline outline-primary rounded'>
                <Icon name='key' className='md:size-3.5 size-3' />
                <span>Account Recovery</span>
              </Link>
            </div>

            <form.SubmitButton label='Log in' />
          </div>
        </form>
      </form.AppForm>
    </>
  )
}
