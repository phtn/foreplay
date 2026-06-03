'use client'
import { AuthLayout } from '@/components/layouts/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Icon } from '@/lib/icons'
import Link from 'next/link'
import { useState } from 'react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   setError('')
  //   if (password !== confirmPassword) {
  //     setError('Passwords do not match')
  //     return
  //   }
  //   setLoading(true)
  //   try {
  //     await base44.auth.register({ email, password })
  //     setShowOtp(true)
  //   } catch (err) {
  //     setError(err.message || 'Registration failed')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleVerify = async () => {
  //   setError('')
  //   setLoading(true)
  //   try {
  //     const result = await base44.auth.verifyOtp({ email, otpCode })
  //     if (result?.access_token) {
  //       base44.auth.setToken(result.access_token)
  //     }
  //     window.location.href = '/'
  //   } catch (err) {
  //     setError(err.message || 'Invalid verification code')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleResend = async () => {
  //   setError('')
  //   try {
  //     await base44.auth.resendOtp(email)
  //     toast({
  //       title: 'Code sent',
  //       description: 'Check your email for the new code.'
  //     })
  //   } catch (err) {
  //     setError(err.message || 'Failed to resend code')
  //   }
  // }

  // const handleGoogle = () => {
  //   base44.auth.loginWithProvider('google', '/')
  // }

  if (showOtp) {
    return (
      <AuthLayout icon={'re-up.ph'} title='Verify your email' subtitle={`We sent a code to ${email}`}>
        {error && <div className='mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm'>{error}</div>}
        <div className='flex justify-center mb-6'>
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete='one-time-code'>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className='w-full h-12 font-medium' onClick={undefined} disabled={loading || otpCode.length < 6}>
          {loading ? (
            <>
              <Icon name='spinner-ring' className='w-4 h-4 mr-2 animate-spin' />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </Button>
        <p className='text-center text-sm text-muted-foreground mt-4'>
          Didn&apos;t receive the code?{' '}
          <button onClick={undefined} className='text-primary font-medium hover:underline'>
            Resend
          </button>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      icon={'flag-fill'}
      title='Create your account'
      subtitle='Sign up to get started'
      footer={
        <>
          Already have an account?{' '}
          <Link href='/auth/login' className='text-primary font-medium hover:underline'>
            Log in
          </Link>
        </>
      }>
      <Button variant='outline' className='w-full h-12 text-sm font-medium mb-5 xl:mb-6 gap-4' onClick={undefined}>
        <Icon name='goog' className='size-3.5' />
        <span>Continue with Google</span>
      </Button>

      <div className='relative mb-2 xl:mb-6'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t-[0.33px] border-border' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-card px-3 text-xs text-muted-foreground'>or</span>
        </div>
      </div>

      {error && <div className='mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm'>{error}</div>}

      <form onSubmit={undefined} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <div className='relative'>
            <Icon
              name='mail'
              className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground'
              aria-hidden='true'
            />
            <Input
              id='email'
              type='email'
              autoComplete='email'
              autoFocus
              placeholder='you@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='pl-10 h-12'
              required
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <div className='relative'>
            <Icon
              name='lock'
              className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground'
              aria-hidden='true'
            />
            <Input
              id='password'
              type='password'
              autoComplete='new-password'
              placeholder='••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='pl-10 h-12'
              required
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirm'>Confirm Password</Label>
          <div className='relative'>
            <Icon
              name='lock'
              className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground'
              aria-hidden='true'
            />
            <Input
              id='confirm'
              type='password'
              autoComplete='new-password'
              placeholder='••••••••'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='pl-10 h-12'
              required
            />
          </div>
        </div>
        <Button type='submit' className='w-full h-12 font-medium' disabled={loading}>
          {loading ? (
            <>
              <Icon name='spinner-ring' className='size-4 mr-2' />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
