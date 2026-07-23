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
          <span className='mr-2 text-foreground/90'>New user?</span>
          <Link
            href='/auth/register'
            className='font-poly text-xs md:text-sm text-emerald-800 dark:text-emerald-400 underline hover:text-foreground hover:decoration-primary underline-offset-4 focus-visible:text-foreground/80 outline-primary'>
            Create an account
          </Link>
        </div>
      }>
      <LoginForm />
    </AuthLayout>
  )
}
