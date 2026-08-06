'use client'

import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

interface GridItem {
  name: string
  icon: IconName
  path: string
  className?: ClassName
}

export const Workspace = () => {
  const router = useRouter()
  const navigate = (path: string) => () => router.push(path)

  const grid_items = useMemo(
    () =>
      [
        { name: 'Templates', icon: 'email-sending', path: '/admin/config/messaging/templates' },
        { name: 'Mailing List', icon: 'mail', path: '/admin/config/messaging/mailing-list' },
        { name: 'Broadcast', icon: 'send', path: '/admin/config/messaging/broadcast', className: 'border-b-0' },
        { name: 'Webhooks', icon: 'webhook', path: '/admin/config/messaging/webhooks' }
      ] as GridItem[],
    []
  )

  return (
    <div className='p-2'>
      <div className='pb-4'>
        <h2 id='messaging-heading' className='flex items-center font-poly font-medium text-xl space-x-4'>
          <span>Messaging</span>
          <Icon name='send' className='size-5' />
        </h2>
      </div>
      <div className='grid grid-cols-2 [&>*:nth-child(even)]:border-r-0 divide-x divide-y divide-border/25 border border-foreground/10 rounded-sm'>
        {grid_items.map((item, index) => (
          <button onClick={navigate(item.path)} key={index} className={cn(item.className, 'hover:bg-foreground/2')}>
            <div className='h-40 flex items-center justify-center'>
              <div className='flex flex-col items-center space-y-1.5'>
                <Icon name={item.icon} className='size-6 opacity-80' />
                <p className='font-poly'>{item.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
