'use client'

import {
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  isResolvedTheme,
  isTheme,
  resolveTheme,
  type ResolvedTheme,
  type Theme
} from '@/lib/theme'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggle: VoidFunction
  darkTheme: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(storedTheme) ? storedTheme : 'light'
  } catch {
    return 'light'
  }
}

function getPreferredTheme(): ResolvedTheme {
  return resolveTheme('system', typeof window.matchMedia === 'function' && window.matchMedia(THEME_MEDIA_QUERY).matches)
}

interface ThemeState {
  theme: Theme
  resolvedTheme: ResolvedTheme
}

function applyTheme(theme: Theme): ResolvedTheme {
  const resolvedTheme = resolveTheme(theme, getPreferredTheme() === 'dark')
  const root = document.documentElement

  root.dataset.theme = resolvedTheme
  root.dataset.themePreference = theme
  root.style.colorScheme = resolvedTheme
  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.classList.toggle('light', resolvedTheme === 'light')

  return resolvedTheme
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {}
}

function getInitialThemeState(): ThemeState {
  if (typeof document === 'undefined') {
    return { theme: 'light', resolvedTheme: 'light' }
  }

  const theme = isTheme(document.documentElement.dataset.themePreference)
    ? document.documentElement.dataset.themePreference
    : readStoredTheme()
  const expectedResolvedTheme = resolveTheme(theme, getPreferredTheme() === 'dark')
  const resolvedTheme = isResolvedTheme(document.documentElement.dataset.theme)
    ? document.documentElement.dataset.theme
    : expectedResolvedTheme

  if (resolvedTheme !== expectedResolvedTheme) {
    return { theme, resolvedTheme: applyTheme(theme) }
  }

  return { theme, resolvedTheme }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ theme, resolvedTheme }, setThemeState] = useState<ThemeState>(getInitialThemeState)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY)

    const syncSystemTheme = () => {
      if (document.documentElement.dataset.themePreference !== 'system') {
        return
      }

      setThemeState({ theme: 'system', resolvedTheme: applyTheme('system') })
    }

    mediaQuery.addEventListener('change', syncSystemTheme)

    return () => mediaQuery.removeEventListener('change', syncSystemTheme)
  }, [])

  const setTheme = useCallback((nextTheme: Theme) => {
    persistTheme(nextTheme)
    setThemeState({ theme: nextTheme, resolvedTheme: applyTheme(nextTheme) })
  }, [])

  const darkTheme = resolvedTheme === 'dark'
  const toggle = useCallback(() => {
    setTheme(darkTheme ? 'light' : 'dark')
  }, [darkTheme, setTheme])
  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggle, darkTheme }),
    [darkTheme, resolvedTheme, setTheme, theme, toggle]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
