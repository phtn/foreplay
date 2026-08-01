import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center w-fit border border-transparent font-medium whitespace-nowrap outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-3',
  {
    variants: {
      variant: {
        'top-g-outline':
          'bg-slate-100 dark:bg-orange-300/10 border border-slate-500 dark:border-slate-400 text-slate-700 dark:text-slate-200',
        og: 'bg-taupe-700 dark:bg-taupe-400 dark:text-black text-white',
        'og-light': 'bg-taupe-100 dark:bg-taupe-400/20 text-taupe-950 dark:text-taupe-300',
        'og-outline':
          'bg-taupe-50 dark:bg-taupe-300/30 border border-taupe-500 dark:border-taupe-300 text-taupe-700 dark:text-taupe-300',
        god: 'bg-indigo-700 dark:bg-indigo-500 text-white',
        'god-light': 'bg-indigo-50 dark:bg-indigo-400/20 text-indigo-950 dark:text-indigo-300',
        default: 'bg-sky-500 text-primary-foreground',
        outline: 'border-border bg-transparent dark:bg-input/32',
        secondary: 'bg-secondary text-secondary-foreground',
        info: 'bg-info text-white',
        success: 'bg-success text-white',
        warning: 'bg-warning text-white',
        destructive: 'bg-destructive text-white',
        focus: 'bg-focus text-focus-foreground',
        invert: 'bg-invert text-invert-foreground',
        'god-outline':
          'bg-indigo-50 dark:bg-indigo-50 dark:bg-indigo-400/10 border border-indigo-500 dark:border-indigo-300 text-indigo-700 dark:text-indigo-300',
        'default-outline': 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400',
        'primary-light': 'bg-primary/10 border-none text-primary dark:bg-primary/20',
        'warning-light': 'bg-orange-500/5 border-none text-orange-400 dark:bg-orange-400/10',
        'success-light': 'bg-primary/5 border-none text-emerald-500 dark:bg-success/5',
        'info-light': 'bg-info/10 border-none text-info-foreground dark:bg-info/10',
        'destructive-light': 'bg-destructive/10 border-none text-destructive-foreground dark:bg-destructive/20',
        'invert-light': 'bg-invert/10 border-none text-foreground dark:bg-invert/20',
        'focus-light': 'bg-focus/10 border-none text-focus-foreground dark:bg-focus/20',
        'primary-outline': 'bg-background border-border text-primary dark:bg-input/30',
        'warning-outline': 'bg-background border-border text-warning-foreground dark:bg-input/30',
        'success-outline': 'bg-background border-border text-success-foreground dark:bg-input/30',
        'info-outline': 'bg-background border-border text-info-foreground dark:bg-info/30',
        'destructive-outline': 'bg-background border-border text-destructive-foreground dark:bg-input/30',
        'invert-outline': 'bg-background border-border text-invert-foreground dark:bg-input/30',
        'focus-outline': 'bg-focus/10 border-focus/30 text-focus-foreground dark:bg-focus/10'
      },
      size: {
        xs: 'px-1 py-0.25 text-[0.6rem] leading-none h-4 min-w-4 gap-1',
        sm: 'px-1 py-0.25 text-[0.625rem] leading-none h-4.5 min-w-4.5 gap-1',
        default: 'px-1.25 py-0.5 text-[11px] h-5 min-w-5 gap-1',
        md: 'px-1.25 py-0.5 text-[11px] h-5 min-w-5 gap-1',
        lg: 'px-1.5 py-0.5 text-xs h-5.5 min-w-5.5 gap-1',
        xl: 'px-2 py-0.75 text-sm h-6 min-w-6 gap-1.5'
      },
      /** `default`: per-theme radius. `full`: max radius per theme (Lyra stays `rounded-none`). */
      radius: {
        default: 'rounded-4xl',
        full: 'rounded-full',
        lg: 'rounded-lg',
        md: 'rounded-md',
        sm: 'rounded-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      radius: 'default'
    }
  }
)

interface BadgeProps extends useRender.ComponentProps<'span'> {
  variant?: VariantProps<typeof badgeVariants>['variant']
  size?: VariantProps<typeof badgeVariants>['size']
  radius?: VariantProps<typeof badgeVariants>['radius']
}

function Badge({ className, variant, size, radius, render, ...props }: BadgeProps) {
  const defaultProps = {
    'data-slot': 'badge',
    className: cn(badgeVariants({ variant, size, radius, className }))
  }

  return useRender({
    defaultTagName: 'span',
    render,
    props: mergeProps<'span'>(defaultProps, props)
  })
}

export { Badge, badgeVariants, type BadgeProps }
