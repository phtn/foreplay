import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ThemeProvider } from '@/components/theme'
import { ConvexClientProvider } from '@/ctx/convex-client-provider'
import { FirebaseAuthBootstrapProvider } from '@/lib/firebase/auth'
import type { InitialFirebaseAuthState } from '@/lib/firebase/auth-state'
import type { ReactNode } from 'react'

export function RootProviders({
  children,
  initialAuthState
}: {
  children: ReactNode
  initialAuthState: InitialFirebaseAuthState
}) {
  return (
    <NuqsAdapter>
      <ConvexClientProvider>
        <FirebaseAuthBootstrapProvider initialState={initialAuthState}>
          <ThemeProvider>{children}</ThemeProvider>
        </FirebaseAuthBootstrapProvider>
      </ConvexClientProvider>
    </NuqsAdapter>
  )
}
