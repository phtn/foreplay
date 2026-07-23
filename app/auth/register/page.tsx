import { AuthLayout } from '@/components/layouts/auth'
import Link from 'next/link'
import { RegisterForm } from '../_components/register-form'

export default function Register() {
  return (
    <AuthLayout
      icon='golf-tee'
      title='Foreplay'
      subtitle='Create new account'
      footer={
        <div className='px-4'>
          <span className='mr-2 text-foreground/90'>Already have an account?</span>
          <Link
            href='/auth/login'
            className='font-poly text-xs md:text-sm text-emerald-800 dark:text-primary underline hover:text-foreground hover:decoration-primary underline-offset-4 focus-visible:text-foreground/80 outline-primary'>
            Log in
          </Link>
        </div>
      }>
      <RegisterForm />
    </AuthLayout>
  )
}
