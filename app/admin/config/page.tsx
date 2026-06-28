import { Metadata } from 'next'
import { EventsContent } from './_contents/events'
import { StaffContent } from './_contents/staff'
import { Tabs } from './tabs'

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
  const tabs = [
    { value: 'staff', label: 'Staff', content: <StaffContent /> },
    { value: 'events', label: 'Events', content: <EventsContent /> },
    { value: 'payments', label: 'Payments', content: '' }
  ]
  return (
    <main className='mx-auto flex w-full max-w-7xl flex-col px-4 pt-2 md:pt-0 pb-2'>
      {/*<div className='flex gap-4 items-start justify-between'>
        <div>
          <p className='font-ios text-xs uppercase tracking-wider text-sky-600 dark:text-sky-500'>Settings</p>
          <h1 className='font-okx font-semibold tracking-wide text-xl'>Admin</h1>
        </div>
      </div>*/}
      <Tabs tabs={tabs} />
    </main>
  )
}
