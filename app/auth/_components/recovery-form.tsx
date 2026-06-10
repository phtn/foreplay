'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getFirebaseAuthErrorMessage, isFirebaseAuthError, sendPasswordReset } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { type FormEvent, useState } from 'react'
import { AuthErrorMessage } from './auth-error-message'

export function RecoveryForm() {
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch (error) {
      if (isFirebaseAuthError(error, 'auth/user-not-found')) {
        setSent(true)
      } else {
        setErrorMessage(getFirebaseAuthErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return sent ? (
    <p className='text-center text-sm text-foreground'>
      If an account exists with that email, you&apos;ll receive a password reset link shortly.
    </p>
  ) : (
    <>
      <AuthErrorMessage message={errorMessage} />

      <form onSubmit={handleSubmit} className='space-y-4' aria-busy={isSubmitting}>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email address</Label>
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
    </>
  )
}
