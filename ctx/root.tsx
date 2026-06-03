import { ThemeProvider } from '@/components/theme'
import type { ReactNode } from 'react'

export function RootProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
