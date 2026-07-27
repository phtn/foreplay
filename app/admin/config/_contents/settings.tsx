'use client'

import { useFirebaseUser } from '@/lib/firebase/auth'
import { ProductOrderTones } from './(settings)/product-order-tones'
import { TicketScanTones } from './(settings)/ticket-scan-tones'

export const SettingsContent = () => {
  const { user } = useFirebaseUser()

  return (
    <div className='flex flex-col gap-12 px-4 pb-24 md:px-0'>
      <ProductOrderTones user={user} />
      <TicketScanTones user={user} />
    </div>
  )
}
