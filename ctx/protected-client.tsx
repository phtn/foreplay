'use client'

import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'

import { Topbar } from '@/components/layouts/topbar'
import { useToggle } from '@/hooks/use-toggle'
import { useFirebaseUser } from '@/lib/firebase/auth'

export default function ProtectedClient({ children }: PropsWithChildren) {
  const { on: mobileOpen, setOn: setMobileOpen } = useToggle(false)
  const { user } = useFirebaseUser()
  const pathname = usePathname()

  return (
    <div className='min-h-screen bg-background'>
      <Topbar pathname={pathname} user={user} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className='mx-auto max-w-7xl px-4 py-6 md:px-6'>{children}</main>
    </div>
  )
}
