import { Metadata } from 'next'
import { MailingListContent } from './content'
// import { MailingListContent } from '../send/components/mailing-list'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mailing Lists',
  description: 'Manage saved mailing lists.'
}

const Page = () => <MailingListContent />

export default Page
