'use client'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/lib/icons'
import Link from 'next/link'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setError("");
  //   setLoading(true);
  //   try {
  //     await base44.auth.loginViaEmailPassword(email, password);
  //     window.location.href = "/";
  //   } catch (err) {
  //     setError(err.message || "Invalid email or password");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleGoogle = () => {
  //   base44.auth.loginWithProvider("google", "/");
  // };

  return (
    <AuthLayout
      icon='flag-fill'
      title='Welcome back'
      subtitle='Log in to your account'
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href='/auth/register' className='text-primary font-medium hover:underline underline-offset-2'>
            Create one
          </Link>
        </>
      }>
      <Button variant='outline' className='w-full h-12 text-sm font-medium mb-5 xl:mb-6 gap-4' onClick={undefined}>
        <Icon name='goog' className='size-3.5' />
        <span>Continue with Google</span>
      </Button>

      <div className='relative mb-3 xl:mb-6'>
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
          <div className='flex items-center justify-between'>
            <Label htmlFor='password'>Password</Label>
            <Link href='/auth/recovery' className='text-xs text-primary hover:underline'>
              Forgot password?
            </Link>
          </div>
          <div className='relative'>
            <Icon
              name='lock'
              className='absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground'
              aria-hidden='true'
            />
            <Input
              id='password'
              type='password'
              autoComplete='current-password'
              placeholder='••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='pl-10 h-12'
              required
            />
          </div>
        </div>
        <Button type='submit' className='w-full h-12 font-medium bg-primary' disabled={loading}>
          {loading ? (
            <>
              <Icon name='spinner-ring' className='size-4 mr-2' />
              Logging in...
            </>
          ) : (
            'Log in'
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
