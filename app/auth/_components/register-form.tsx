'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { type FormEvent, useState } from 'react'
import { AuthDivider } from './auth-divider'
import { AuthErrorMessage } from './auth-error-message'

type SubmissionKind = 'email' | 'google' | null

async function syncFirebaseSession(user: User) {
  await createFirebaseSession(await user.getIdToken(true))
}

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submissionKind, setSubmissionKind] = useState<SubmissionKind>(null)
  const { user, isLoading: isAuthLoading } = useFirebaseUser()
  const router = useRouter()

  const isSubmitting = submissionKind !== null
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setSubmissionKind('email')

    try {
      const credential = await registerWithEmailPassword(email, password)
      await syncFirebaseSession(credential.user)
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

      <form onSubmit={handleSubmit} className='space-y-4' aria-busy={isSubmitting}>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <div className='relative'>
            <Icon
              name='mail'
              className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
              aria-hidden='true'
            />
            <Input
              id='email'
              name='email'
              type='email'
              autoComplete='email'
              autoFocus
              placeholder='you@example.com'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className='h-12 pl-10'
              disabled={isSubmitting}
              required
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <div className='relative'>
            <Icon
              name='lock'
              className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
              aria-hidden='true'
            />
            <Input
              id='password'
              name='password'
              type='password'
              autoComplete='new-password'
              placeholder='••••••••'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className='h-12 pl-10'
              disabled={isSubmitting}
              minLength={6}
              required
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirm-password'>Confirm Password</Label>
          <div className='relative'>
            <Icon
              name='lock'
              className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
              aria-hidden='true'
            />
            <Input
              id='confirm-password'
              name='confirmPassword'
              type='password'
              autoComplete='new-password'
              placeholder='••••••••'
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className='h-12 pl-10'
              disabled={isSubmitting}
              minLength={6}
              required
            />
          </div>
        </div>
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
    </>
  )
}
