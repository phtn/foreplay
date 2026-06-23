import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ThemeProvider } from '@/components/theme'
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
      <FirebaseAuthBootstrapProvider initialState={initialAuthState}>
        <ThemeProvider>{children}</ThemeProvider>
      </FirebaseAuthBootstrapProvider>
    </NuqsAdapter>
  )
}
