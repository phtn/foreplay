import { Metadata } from 'next'
import { EmailTemplateContent } from './content'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Email Templates',
  description: 'Email configuration and setup.',
  icons: [
    {
      rel: 'icon',
      url: '/svg/rf-icon-latest.svg'
    }
  ]
}
const Page = () => <EmailTemplateContent />
export default Page
