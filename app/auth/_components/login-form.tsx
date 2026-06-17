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

export function LoginForm() {
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
        router.replace('/')
      } catch (error) {
        setErrorMessage(getFirebaseAuthErrorMessage(error))
        setSubmissionKind(null)
      }
    }
  })

  const isSubmitting = submissionKind !== null || form.state.isSubmitting
  const googleButtonLabel =
    submissionKind === 'google' ? (user ? 'Granting' : 'Connecting') : user ? 'Dashboard' : 'Google'

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
      <div className='grid w-full grid-cols-6 gap-4'>
        <Button
          type='button'
          className={cn(
            'col-span-3 h-12 gap-3 text-sm font-medium xl:mb-6 border-foreground/40 hover:border-primary dark:hover:border-white dark:border-white/55 bg-white/80 hover:bg-white dark:bg-white/30 dark:hover:bg-white/25 inline-flex items-center justify-center rounded-md border px-4 transition-colors disabled:pointer-events-none disabled:opacity-70',
            { 'disabled:opacity-100': isAuthLoading }
          )}
          onClick={handleGoogle}
          disabled={isSubmitting || isAuthLoading}>
          <Icon
            name={submissionKind === 'google' ? 'spinner-ring' : 'goog'}
            className={cn('size-4.5 text-foreground', { 'size-4': isAuthLoading })}
          />
          <span className='dark:text-white text-foreground/60 font-sans'>{googleButtonLabel}</span>
        </Button>
        <Button
          type='button'
          className='h-12 gap-2 text-sm font-medium xl:mb-6 hover:border-primary dark:hover:border-white dark:border-white/55 bg-white/80 hover:bg-white dark:bg-white/30 dark:hover:bg-white/25 inline-flex items-center justify-center rounded-md border px-4 transition-colors disabled:pointer-events-none disabled:opacity-50'
          disabled>
          <Icon name={'x'} className='size-4.5 text-foreground' />
        </Button>
        <Button
          type='button'
          className='h-12 text-sm font-medium xl:mb-6 hover:border-primary dark:hover:border-white dark:border-white/55 bg-white/80 hover:bg-white dark:bg-white/30 dark:hover:bg-white/25 inline-flex items-center justify-center rounded-md border px-4 transition-colors disabled:pointer-events-none disabled:opacity-50'
          disabled>
          <Icon name={'github'} className='size-8 text-foreground' />
        </Button>
        <Button
          type='button'
          className='h-12 gap-3 text-sm font-medium xl:mb-6 hover:border-primary dark:hover:border-white dark:border-white/55 bg-white/80 hover:bg-white dark:bg-white/30 dark:hover:bg-white/25 inline-flex items-center justify-center rounded-md border px-4 transition-colors disabled:pointer-events-none disabled:opacity-50'
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
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center w-full gap-0'>
              <Link
                href='/auth/recovery'
                className='flex items-center space-x-1 text-sm text-emerald-800 dark:text-foreground/80 hover:underline decoration-primary underline-offset-4 focus-visible:outline outline-primary rounded'>
                <Icon name='key' className='size-4.5' />
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
