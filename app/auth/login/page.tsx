import { AuthLayout } from '@/components/layouts/auth'
import Link from 'next/link'
import { LoginForm } from '../_components/login-form'

export default function Login() {
  return (
    <AuthLayout
      icon='golf-tee'
      title='Foreplay'
      subtitle='Sign in'
      footer={
        <div className='px-4'>
          <span className='mr-2'>New user account?</span>
          <Link
            href='/auth/register'
            className='font-poly text-xs md:text-sm text-emerald-800 dark:text-primary underline hover:text-foreground hover:decoration-primary underline-offset-4 focus-visible:text-foreground/80 outline-primary'>
            Create
          </Link>
        </div>
      }>
      <LoginForm />
    </AuthLayout>
  )
}
