import { ThemeProvider } from '@/components/theme'
import { ConvexClientProvider } from '@/ctx/convex-client-provider'
import { FirebaseAuthBootstrapProvider } from '@/lib/firebase/auth'
import type { InitialFirebaseAuthState } from '@/lib/firebase/auth-state'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'
import { Toasts } from './toast'

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
          <Toasts />
        </FirebaseAuthBootstrapProvider>
      </ConvexClientProvider>
    </NuqsAdapter>
  )
}
