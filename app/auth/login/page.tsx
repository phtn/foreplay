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
          Don&apos;t have an account?{' '}
          <Link href='/auth/register' className='text-primary font-medium hover:underline underline-offset-2'>
            Create one
          </Link>
        </>
      }>
      <LoginForm />
    </AuthLayout>
  )
}
