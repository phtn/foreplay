import { Metadata } from 'next'
import { requireAdminSession } from '@/lib/firebase/server-auth'
import { Content } from './content'

export const metadata: Metadata = {
  title: 'Email Webhooks',
  description: 'Webhooks for email events',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/apple-icon.png'
    }
  ]
}
const Page = async () => {
  await requireAdminSession()

  return <Content />
}
export default Page
