import { AuthLayout } from '@/components/layouts/auth'
import { getSafeRedirectPath } from '@/lib/routing/auth-redirect'
import Link from 'next/link'
import { RegisterForm } from '../_components/register-form'

interface RegisterPageProps {
  searchParams: Promise<{ redirectTo?: string | string[] }>
}

export default async function Register({ searchParams }: RegisterPageProps) {
  const query = await searchParams
  const redirectTo = getSafeRedirectPath(query.redirectTo)
  const loginQuery = new URLSearchParams({ redirectTo }).toString()

  return (
    <AuthLayout
      icon='golf-tee'
      title='Foreplay'
      subtitle='Create new account'
      footer={
        <div className='px-4'>
          <span className='mr-2 text-foreground/90'>Already have an account?</span>
          <Link
            href={`/auth/login?${loginQuery}`}
            className='font-poly text-xs md:text-sm text-emerald-800 dark:text-primary underline hover:text-foreground hover:decoration-primary underline-offset-4 focus-visible:text-foreground/80 outline-primary'>
            Log in
          </Link>
        </div>
      }>
      <RegisterForm redirectTo={redirectTo} />
    </AuthLayout>
  )
}
