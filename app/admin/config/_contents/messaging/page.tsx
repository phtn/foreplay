import type { Metadata } from 'next'
import { Workspace } from './workspace'

export const metadata: Metadata = {
  title: 'Messaging',
  description: 'Manage email templates and message settings.',
  icons: [
    {
      rel: 'icon',
      url: '/apple-icon.png'
    }
  ]
}

export default function MessagingPage() {
  return <Workspace />
}
