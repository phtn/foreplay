import { Icon } from '@/lib/icons'
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
  title: 'Admin Settings',
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
    {
      value: 'create-event',
      label: <Icon name='add' className='md:size-5 transition-transform duration-250 group-active:scale-98' />,
      content: <CreateEventContent />
    },
    { value: 'events', label: 'Events', content: <EventsContent /> },
    { value: 'staff', label: 'Staff', content: <StaffContent /> },
    {
      value: 'users',
      label: <Icon name='user-fill' className='md:size-5 transition-transform duration-250 group-active:scale-98' />,
      content: <UsersContent />
    },
    {
      value: 'payments',
      label: <Icon name='card-pay' className='md:size-5 transition-transform duration-250 group-active:scale-98' />,
      content: <PaymentsContent />
    },
    {
      value: 'settings',
      label: <Icon name='music-note' className='md:size-5 transition-transform duration-250 group-active:scale-98' />,
      content: <SettingsContent />
    },
    {
      value: 'messaging',
      label: <Icon name='send' className='md:size-5 transition-transform duration-250 group-active:scale-98' />,
      content: <MessagingContent />
    }
  ]

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-col md:px-4 pt-4 md:pt-0 pb-2'>
      <Tabs tabs={tabs} className='font-okx' />
    </main>
  )
}
