import { AuthLayout } from '@/components/layouts/auth'
import Link from 'next/link'
import { LoginForm } from '../_components/login-form'

export default function Login() {
  return (
    <AuthLayout
      icon='golf-tee'
      title='Log in'
      subtitle='User Account'
      footer={
        <>
          <span className='mr-2'>New user account?</span>
          <Link
            href='/auth/register'
            className='text-sm text-emerald-800 dark:text-primary font-medium underline hover:text-foreground hover:decoration-primary underline-offset-4 focus-visible:text-foreground/80 outline-primary'>
            Create
          </Link>
        </>
      }>
      <LoginForm />
    </AuthLayout>
  )
}
