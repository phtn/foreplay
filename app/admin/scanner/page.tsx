import { requireGateScannerSession } from '@/lib/firebase/server-auth'
import type { Metadata } from 'next'
import { GateScanner } from './scanner'

export const metadata: Metadata = {
  title: 'Gate Scanner',
  description: 'Scan player gate passes and check in confirmed entries.',
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
  const session = await requireGateScannerSession()
  const operator = session.decodedToken.email ?? session.decodedToken.sub

  return <GateScanner operator={operator} />
}
