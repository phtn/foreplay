import { AuthLayout } from '@/components/layouts/auth'
import Link from 'next/link'
import { RegisterForm } from '../_components/register-form'

export default function Register() {
  return (
    <AuthLayout
      icon='golf-tee'
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
      <RegisterForm />
    </AuthLayout>
  )
}
