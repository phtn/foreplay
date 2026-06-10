import { PropsWithChildren } from 'react'

import ProtectedClient from './protected-client'

export default function ProtectedLayout({ children }: PropsWithChildren) {
  return <ProtectedClient>{children}</ProtectedClient>
}
