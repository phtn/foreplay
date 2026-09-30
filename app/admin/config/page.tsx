import { Metadata } from 'next'
import { CreateEventContent } from './_contents/create-event'
import { EventsContent } from './_contents/events'
import { MessagingContent } from './_contents/messaging-content'
import { PaymentsContent } from './_contents/payments'
import { SettingsContent } from './_contents/settings'
import { StaffContent } from './_contents/staff'
import { UsersContent } from './_contents/users'
import { Tab, Tabs } from './tabs'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Foreplay Admin',
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      sizes: '32x32',
      url: '/favicon-32x32.svg'
    }
  ]
}

export default async function Page() {
  const tabs: Tab[] = [
    { value: 'create-event', label: 'Create event', icon: 'add', content: <CreateEventContent /> },
    { value: 'events', label: 'Events', icon: 'trophy-line', content: <EventsContent /> },
    { value: 'staff', label: 'Staff', icon: 'person-multiple', content: <StaffContent /> },
    { value: 'users', label: 'Users', icon: 'user-fill', content: <UsersContent /> },
    { value: 'payments', label: 'Payments', icon: 'card-pay', content: <PaymentsContent /> },
    { value: 'settings', label: 'Settings', icon: 'music-note', content: <SettingsContent /> },
    { value: 'messaging', label: 'Messaging', icon: 'send', content: <MessagingContent /> }
  ]

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-col md:px-4 pt-4 md:pt-0 pb-2'>
      <Tabs tabs={tabs} className='font-okx' />
    </main>
  )
}
