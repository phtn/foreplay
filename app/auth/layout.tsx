import { getVerifiedFirebaseSession } from '@/lib/firebase/server-auth'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

type AuthRouteLayoutProps = {
  children: ReactNode
}

export default async function AuthRouteLayout({ children }: AuthRouteLayoutProps) {
  if (await getVerifiedFirebaseSession()) {
    redirect('/')
  }

  return children
}
