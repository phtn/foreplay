import { AuthLayout } from '@/components/layouts/auth'
import { Icon } from '@/lib/icons'
import Link from 'next/link'
import { RecoveryForm } from '../_components/recovery-form'

export default function Recovery() {
  return (
    <AuthLayout
      icon='re-up.ph'
      title='Account Recovery'
      subtitle='Password Reset'
      footer={
        <Link href='/auth/login' className='text-primary font-medium hover:underline'>
          <Icon name='arrow-right' className='w-3 h-3 inline mr-1 -rotate-180' />
          Back to log in
        </Link>
      }>
      <RecoveryForm />
    </AuthLayout>
  )
}
