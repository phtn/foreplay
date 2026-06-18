'use client'

import { useTheme } from '@/components/theme'
import { Icon } from '@/lib/icons'
import { resolveTheme, THEME_MEDIA_QUERY, type ResolvedTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { type MouseEvent } from 'react'
import { flushSync } from 'react-dom'

type ThemeTransition = {
  ready: Promise<void>
  finished: Promise<void>
}

type ThemeTransitionDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => ThemeTransition
}

type ThemeTransitionAnimationOptions = KeyframeAnimationOptions & {
  pseudoElement?: string
}

const themeLabels: Record<ResolvedTheme, string> = {
  light: 'Light',
  dark: 'Dark'
}

const themeShortLabels: Record<ResolvedTheme, string> = {
  light: 'Li',
  dark: 'Da'
}

interface ThemeToggleProps {
  label?: string
  withLabel?: boolean
}
export const ThemeToggle = ({ label, withLabel = false }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme()
  const currentTheme = resolvedTheme
  const nextTheme: ResolvedTheme = currentTheme === 'dark' ? 'light' : 'dark'

  const handleThemeChange = (event: MouseEvent<HTMLButtonElement>) => {
    const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia(THEME_MEDIA_QUERY).matches
    const nextResolvedTheme = resolveTheme(nextTheme, prefersDark)

    if (resolvedTheme === nextResolvedTheme) {
      setTheme(nextTheme)
      return
    }

    const documentWithTransition = document as ThemeTransitionDocument
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!documentWithTransition.startViewTransition || prefersReducedMotion) {
      setTheme(nextTheme)
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const root = document.documentElement
    const x = event.clientX || bounds.left + bounds.width / 2
    const y = event.clientY || bounds.top + bounds.height / 2
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 8
    const collapsedClip = `circle(0px at ${x}px ${y}px)`
    const expandedClip = `circle(${endRadius}px at ${x}px ${y}px)`
    const animationOptions = {
      duration: 650,
      easing: 'cubic-bezier(0.76, 0, 0.24, 1)'
    } satisfies ThemeTransitionAnimationOptions

    root.setAttribute('data-theme-transition', nextResolvedTheme === 'light' ? 'to-light' : 'to-dark')

    const transition = documentWithTransition.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    })

    const cleanup = () => {
      root.removeAttribute('data-theme-transition')
    }

    void transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [collapsedClip, expandedClip]
          },
          {
            ...animationOptions,
            pseudoElement: '::view-transition-new(root)'
          } satisfies ThemeTransitionAnimationOptions
        )

        root.animate(
          {
            clipPath: [expandedClip, expandedClip]
          },
          {
            ...animationOptions,
            pseudoElement: '::view-transition-old(root)'
          } satisfies ThemeTransitionAnimationOptions
        )
      })
      .catch(cleanup)

    void transition.finished.finally(cleanup)
  }

  return (
    <button
      type='button'
      aria-label={`Switch theme from ${themeLabels[currentTheme]} to ${themeLabels[nextTheme]}`}
      suppressHydrationWarning
      title={`Theme: ${themeLabels[currentTheme]}. Next: ${themeLabels[nextTheme]}`}
      className={cn('inline-flex h-8 aspect-square items-center justify-center rounded-full group cursor-pointer', {
        'w-full justify-start space-x-4 capitalize': withLabel
      })}
      onClick={handleThemeChange}>
      <Icon
        name='theme'
        className={cn(
          'size-4 opacity-80 group-active:scale-80 transition-all duration-250 ease-in text-slate-600 dark:text-slate-200',
          {
            'rotate-90': themeShortLabels[currentTheme] === 'Da',
            '-rotate-90': themeShortLabels[currentTheme] === 'Li'
          }
        )}
      />
      {withLabel && <p className='capitalize'>{(label ?? currentTheme === 'dark') ? 'light' : 'dark'}</p>}
    </button>
  )
}
