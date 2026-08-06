import { Metadata } from 'next'
import { BroadcastContent } from './content'
// import { BroadcastContent } from '../send/components/mailing-list'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Broadcasting',
  description: 'Manage broadcasting campaigns.'
}

const Page = () => <BroadcastContent />

export default Page
