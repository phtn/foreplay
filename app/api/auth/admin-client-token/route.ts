import { getFirebaseAdminAuth } from '@/lib/firebase/admin'
import { getVerifiedGateScannerSession } from '@/lib/firebase/server-auth'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const session = await getVerifiedGateScannerSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    const auth = getFirebaseAdminAuth()

    if (!auth) {
      return NextResponse.json({ error: 'Firebase Admin credentials are not configured.' }, { status: 500 })
    }

    const token = await auth.createCustomToken(session.decodedToken.sub)

    return NextResponse.json(
      { token },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to mint the admin client token.' },
      { status: 500 }
    )
  }
}
