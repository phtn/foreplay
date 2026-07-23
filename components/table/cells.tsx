import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card'
import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { ClassName } from '@/types'
import { formatEventDate } from '@/utils/formatters'
import type { CellContext } from '@tanstack/react-table'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from 'react'
import { Button } from '../ui/button'
import {
  appendInternalPathSegment,
  toSafeInternalHref
} from './safe-navigation'

interface CellOptions<T> {
  className?: ClassName
  formatter?: (
    value: unknown,
    context: CellContext<T, unknown>
  ) => ReactNode
  fallback?: ReactNode
}

export type CellCommitHandler<T, Value> = (
  row: T,
  nextValue: Value
) => void | Promise<void>

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
})

const fallbackContent = (fallback: ReactNode, className: ClassName) => (
  <div className={cn('font-brk', className)}>
    {fallback !== undefined ? (
      <span>{fallback}</span>
    ) : (
      <span className='font-brk text-sm opacity-60'>····</span>
    )}
  </div>
)

/**
 * Generic factory for lightweight display cells.
 */
export function superCell<T>(
  prop: keyof T,
  options: CellOptions<T> = {}
) {
  const CellComponent = (context: CellContext<T, unknown>) => {
    const rawValue = context.row.getValue(String(prop))

    if (rawValue === null || rawValue === undefined) {
      return fallbackContent(options.fallback, options.className)
    }

    const value = options.formatter
      ? options.formatter(rawValue, context)
      : String(rawValue)

    return (
      <div className={cn('font-brk text-sm', options.className)}>
        {value}
      </div>
    )
  }

  CellComponent.displayName = `SuperCell(${String(prop)})`
  return CellComponent
}

export const textCell = <T, K extends keyof T>(
  prop: K,
  className?: ClassName,
  fallback?: ReactNode
) => {
  const cell = superCell<T>(prop, { className, fallback })
  cell.displayName = `TextCell(${String(prop)})`
  return cell
}

export const formatText = <T, K extends keyof T>(
  prop: K,
  formatter: (value: string) => string,
  className?: ClassName,
  fallback?: ReactNode
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
    formatter: (value) => formatter(String(value))
  })
  cell.displayName = `FormatTextCell(${String(prop)})`
  return cell
}

interface HoverCellProps {
  content?: ReactNode
  children: ReactNode
  label?: ReactNode
}

export const HoverCell = ({
  children,
  content,
  label
}: HoverCellProps) => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <span className='cursor-default'>{children}</span>
    </HoverCardTrigger>
    {content !== null && content !== undefined ? (
      <HoverCardContent className='bg-sidebar dark:bg-dark-table'>
        <div className='flex items-start space-x-2'>
          <div className='text-3xl'>{label}</div>
          <div>{content}</div>
        </div>
      </HoverCardContent>
    ) : null}
  </HoverCard>
)

export const firstLCell = <T, K extends keyof T>(
  prop: K,
  className?: ClassName,
  fallback?: ReactNode
) => {
  const FirstLastCell = (context: CellContext<T, unknown>) => {
    const rawValue = context.row.getValue(String(prop))
    const names = String(rawValue ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    if (names.length === 0) {
      return fallback !== undefined ? (
        <span className={className}>{fallback}</span>
      ) : (
        <span className='font-brk text-sm'>····</span>
      )
    }

    const displayValue =
      names.length === 1
        ? names[0]
        : `${names[0]} ${names[names.length - 1].charAt(0)}`

    return (
      <span className={cn('leading-none', className)}>
        {displayValue}
      </span>
    )
  }

  FirstLastCell.displayName = `FirstLastCell(${String(prop)})`
  return FirstLastCell
}

/**
 * Creates a same-origin link cell. The href argument is a base path; the cell
 * value is appended as one encoded path segment. Unsafe/external bases render
 * as plain text.
 */
export const linkText = <T, K extends keyof T>(
  prop: K,
  href:
    | string
    | ((context: CellContext<T, unknown>) => string),
  formatter?: (value: string) => string,
  className?: ClassName,
  fallback?: ReactNode
) => {
  const LinkTextComponent = (
    context: CellContext<T, unknown>
  ) => {
    const rawValue = context.row.getValue(String(prop))
    if (rawValue === null || rawValue === undefined) {
      return <div className={cn(className)}>{fallback ?? '—'}</div>
    }

    const rawText = String(rawValue)
    const value = formatter ? formatter(rawText) : rawText
    const baseHref =
      typeof href === 'function' ? href(context) : href
    const safeHref = appendInternalPathSegment(baseHref, rawText)
    const linkClassName = cn(
      'font-brk text-sm uppercase tracking-wide text-mac-blue decoration-dotted underline-offset-4 hover:underline dark:text-blue-400',
      className
    )

    return safeHref ? (
      <Link href={safeHref} className={linkClassName}>
        {value}
      </Link>
    ) : (
      <span className={linkClassName}>{value}</span>
    )
  }

  LinkTextComponent.displayName = `LinkText(${String(prop)})`
  return LinkTextComponent
}

export function moneyCell<T>(
  prop: keyof T,
  options: CellOptions<T> = {}
) {
  const MoneyCellComponent = (
    context: CellContext<T, unknown>
  ) => {
    const rawValue = context.row.getValue(String(prop))
    if (rawValue === null || rawValue === undefined) {
      return fallbackContent(options.fallback, options.className)
    }

    const numericValue = Number(rawValue)
    const formattedValue = options.formatter
      ? options.formatter(rawValue, context)
      : Number.isFinite(numericValue)
        ? currencyFormatter.format(numericValue)
        : (options.fallback ?? '—')

    return (
      <div className='flex items-center justify-start'>
        <div
          className={cn(
            'mr-10 w-full text-right font-okxs text-base',
            options.className
          )}>
          {formattedValue}
        </div>
      </div>
    )
  }

  MoneyCellComponent.displayName = `MoneyCell(${String(prop)})`
  return MoneyCellComponent
}

export const priceCell = <T, K extends keyof T>(
  prop: K,
  formatter: (value: string) => string,
  className?: ClassName,
  fallback?: ReactNode
) => {
  const cell = moneyCell<T>(prop, {
    formatter: (value) => formatter(String(value)),
    className,
    fallback
  })
  cell.displayName = `PriceCell(${String(prop)})`
  return cell
}

export function numberCell<T>(
  prop: keyof T,
  options: CellOptions<T> = {}
) {
  const NumberCellComponent = (
    context: CellContext<T, unknown>
  ) => {
    const rawValue = context.row.getValue(String(prop))
    if (rawValue === null || rawValue === undefined) {
      return fallbackContent(options.fallback, options.className)
    }

    const numericValue = Number(rawValue)
    const formattedValue = options.formatter
      ? options.formatter(rawValue, context)
      : Number.isFinite(numericValue)
        ? integerFormatter.format(numericValue)
        : (options.fallback ?? '—')

    return (
      <div className='flex items-center justify-start'>
        <div
          className={cn(
            'mr-10 w-full text-right font-okxs text-base',
            options.className
          )}>
          {formattedValue}
        </div>
      </div>
    )
  }

  NumberCellComponent.displayName = `NumberCell(${String(prop)})`
  return NumberCellComponent
}

export const countCell = <T, K extends keyof T>(
  prop: K,
  className?: ClassName,
  fallback?: ReactNode
) => {
  const cell = numberCell<T>(prop, { className, fallback })
  cell.displayName = `CountCell(${String(prop)})`
  return cell
}

export const dateCell = <T,>(
  prop: keyof T,
  className?: ClassName,
  fallback?: ReactNode
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
    formatter: (value) => {
      const timestamp = Number(value)
      return Number.isFinite(timestamp)
        ? formatEventDate(timestamp, '')
        : '—'
    }
  })
  cell.displayName = `DateCell(${String(prop)})`
  return cell
}

export const booleanIconCell = <T, K extends keyof T>(
  prop: K,
  icons: {
    trueIcon?: IconName
    falseIcon?: IconName
    /** @deprecated Use falseIcon. */
    falseLabel?: IconName
  } = {},
  className?: ClassName,
  fallback?: ReactNode
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
    formatter: (value) => {
      const enabled = Boolean(value)
      const iconName = enabled
        ? (icons.trueIcon ?? 'check')
        : (icons.falseIcon ?? icons.falseLabel ?? 'x')

      return (
        <div className='flex h-6 items-center'>
          <Icon
            name={iconName}
            className={cn(
              'size-6',
              enabled && 'text-emerald-500'
            )}
          />
        </div>
      )
    }
  })
  cell.displayName = `BooleanIconCell(${String(prop)})`
  return cell
}

export const booleanCell = <T, K extends keyof T>(
  prop: K,
  labels: { trueLabel?: string; falseLabel?: string } = {},
  className?: ClassName,
  fallback?: ReactNode
) => {
  const cell = superCell<T>(prop, {
    className,
    fallback,
    formatter: (value) => (
      <StatusBadge
        status={
          Boolean(value)
            ? (labels.trueLabel ?? 'True')
            : (labels.falseLabel ?? 'False')
        }
      />
    )
  })
  cell.displayName = `BooleanCell(${String(prop)})`
  return cell
}

const StatusBadge = ({ status }: { status: string }) => (
  <span
    data-slot='badge'
    className='inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-vim/10 px-2 py-0.5 text-xs text-foreground dark:bg-greyed'>
    <span
      className='size-2 rounded-full bg-amber-200'
      aria-hidden='true'
    />
    <span className='font-brk'>{status}</span>
  </span>
)

interface EditableStatusOptions<T> {
  labels?: { trueLabel?: string; falseLabel?: string }
  className?: ClassName
  onError?: (error: unknown, row: T) => void
}

/**
 * Boolean toggle cell. Persistence is injected explicitly so this generic
 * component is not coupled to a database schema or mutation implementation.
 */
export const editableStatusCell = <T,>(
  prop: keyof T,
  onChange: CellCommitHandler<T, boolean>,
  options: EditableStatusOptions<T> = {}
) => {
  const EditableStatusComponent = (
    context: CellContext<T, unknown>
  ) => {
    const [isUpdating, setIsUpdating] = useState(false)
    const [failed, setFailed] = useState(false)
    const value = Boolean(context.row.getValue(String(prop)))
    const row = context.row.original

    const handleToggle = useCallback(async () => {
      if (isUpdating) return

      setFailed(false)
      setIsUpdating(true)
      try {
        await onChange(row, !value)
      } catch (error) {
        setFailed(true)
        options.onError?.(error, row)
      } finally {
        setIsUpdating(false)
      }
    }, [isUpdating, row, value])

    return (
      <button
        type='button'
        onClick={() => void handleToggle()}
        disabled={isUpdating}
        aria-pressed={value}
        aria-label={
          failed
            ? 'Status update failed. Try toggling again.'
            : undefined
        }
        data-error={failed || undefined}
        title={failed ? 'Update failed. Try again.' : undefined}
        className={cn(
          'flex w-fit items-center gap-1 rounded-full border border-zinc-200 px-1.5 py-0.5 font-brk text-xs tracking-tighter transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700',
          options.className
        )}>
        {isUpdating ? (
          <span className='mr-0.5 size-2 animate-spin rounded-full border-2 border-current border-t-transparent' />
        ) : (
          <span
            className={cn(
              'mr-0.5 size-2 rounded-full bg-orange-400',
              value && 'bg-blue-500'
            )}
          />
        )}
        <span>
          {value
            ? (options.labels?.trueLabel ?? 'Active')
            : (options.labels?.falseLabel ?? 'Inactive')}
        </span>
      </button>
    )
  }

  EditableStatusComponent.displayName =
    `EditableStatusCell(${String(prop)})`
  return EditableStatusComponent
}

export interface ToggleCellConfig<T, Value> {
  values: readonly [Value, Value]
  labels?: readonly [string, string]
  className?: ClassName
  onError?: (error: unknown, row: T, nextValue: Value) => void
}

/**
 * Two-value toggle with an injected persistence callback.
 */
export const toggleCell = <T, Value>(
  prop: keyof T,
  onChange: CellCommitHandler<T, Value>,
  config: ToggleCellConfig<T, Value>
) => {
  const ToggleCellComponent = (
    context: CellContext<T, unknown>
  ) => {
    const [isUpdating, setIsUpdating] = useState(false)
    const [failed, setFailed] = useState(false)
    const currentValue = context.row.getValue(String(prop)) as Value
    const row = context.row.original
    const isFirstValue = Object.is(currentValue, config.values[0])
    const nextValue = isFirstValue
      ? config.values[1]
      : config.values[0]
    const currentLabel = isFirstValue
      ? (config.labels?.[0] ?? String(config.values[0]))
      : (config.labels?.[1] ?? String(config.values[1]))

    const handleToggle = useCallback(async () => {
      if (isUpdating) return

      setFailed(false)
      setIsUpdating(true)
      try {
        await onChange(row, nextValue)
      } catch (error) {
        setFailed(true)
        config.onError?.(error, row, nextValue)
      } finally {
        setIsUpdating(false)
      }
    }, [isUpdating, nextValue, row])

    return (
      <div className='flex justify-center px-0.5'>
        <Button
          type='button'
          size='icon'
          disabled={isUpdating}
          onClick={() => void handleToggle()}
          aria-label={`Set to ${String(nextValue)}`}
          aria-pressed={isFirstValue}
          data-error={failed || undefined}
          title={
            failed
              ? 'Update failed. Try again.'
              : `Current: ${currentLabel}`
          }
          className={cn(
            'group/tb aspect-square h-6 w-6 bg-alum/10',
            !isFirstValue && 'opacity-85',
            config.className
          )}>
          <Icon
            name={
              isUpdating
                ? 'spinner-ring'
                : isFirstValue
                  ? 'circle-dash-line'
                  : 'circle-check-line'
            }
            className={cn(
              'size-7 text-mac-blue dark:text-mac-blue dark:group-hover/tb:text-slate-600',
              !isFirstValue &&
                'text-slate-300 group-hover/tb:text-slate-600 group-hover/tb:opacity-90 dark:text-slate-600'
            )}
          />
        </Button>
      </div>
    )
  }

  ToggleCellComponent.displayName = `ToggleCell(${String(prop)})`
  return ToggleCellComponent
}

export interface EditableCellOptions<T> {
  className?: ClassName
  placeholder?: string
  maxLength?: number
  onError?: (error: unknown, row: T, nextValue: string) => void
}

/**
 * Inline text editor. Ctrl/Cmd+Enter or blur commits; Escape cancels.
 */
export const editableCell = <T,>(
  prop: keyof T,
  onSave: CellCommitHandler<T, string>,
  options: EditableCellOptions<T> = {}
) => {
  const EditableCellComponent = (
    context: CellContext<T, unknown>
  ) => {
    const originalValue = String(
      context.row.getValue(String(prop)) ?? ''
    )
    const row = context.row.original
    const [isEditing, setIsEditing] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [failed, setFailed] = useState(false)
    const [draftState, setDraftState] = useState({
      source: originalValue,
      value: originalValue
    })
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const savingRef = useRef(false)
    const localValue =
      isEditing || draftState.source === originalValue
        ? draftState.value
        : originalValue
    const setLocalValue = useCallback(
      (value: string) => {
        setDraftState({ source: originalValue, value })
      },
      [originalValue]
    )

    useEffect(() => {
      if (!isEditing) return
      inputRef.current?.focus()
      inputRef.current?.select()
    }, [isEditing])

    const handleSave = useCallback(async () => {
      if (savingRef.current) return
      if (localValue === originalValue) {
        setIsEditing(false)
        return
      }

      savingRef.current = true
      setFailed(false)
      setIsUpdating(true)
      try {
        await onSave(row, localValue)
        setIsEditing(false)
      } catch (error) {
        setFailed(true)
        setLocalValue(originalValue)
        setIsEditing(false)
        options.onError?.(error, row, localValue)
      } finally {
        savingRef.current = false
        setIsUpdating(false)
      }
    }, [localValue, originalValue, row, setLocalValue])

    const handleCancel = useCallback(() => {
      if (savingRef.current) return
      setLocalValue(originalValue)
      setFailed(false)
      setIsEditing(false)
    }, [originalValue, setLocalValue])

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (
          event.key === 'Enter' &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          void handleSave()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          handleCancel()
        }
      },
      [handleCancel, handleSave]
    )

    if (isEditing) {
      return (
        <div className='relative'>
          <textarea
            ref={inputRef}
            value={localValue}
            onChange={(event) => setLocalValue(event.target.value)}
            onBlur={() => void handleSave()}
            onKeyDown={handleKeyDown}
            disabled={isUpdating}
            maxLength={Math.max(
              1,
              Math.min(100_000, options.maxLength ?? 10_000)
            )}
            placeholder={options.placeholder ?? 'Add notes...'}
            rows={1}
            className={cn(
              'min-h-5 max-h-30 w-full min-w-50 resize-none rounded-md border border-primary/50 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-background/50 md:text-sm',
              options.className
            )}
          />
          {isUpdating ? (
            <span className='absolute top-1 right-1 size-3 animate-spin rounded-full border-2 border-current border-t-transparent' />
          ) : null}
        </div>
      )
    }

    return (
      <button
        type='button'
        onClick={() => {
          setLocalValue(localValue)
          setFailed(false)
          setIsEditing(true)
        }}
        aria-label={
          failed
            ? 'Edit value. The previous update failed.'
            : undefined
        }
        data-error={failed || undefined}
        className={cn(
          'w-full min-w-50 truncate rounded-md px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/50 md:text-sm',
          options.className
        )}
        title={
          failed
            ? 'Update failed. Try again.'
            : localValue || options.placeholder || 'Add notes...'
        }>
        {localValue || (
          <span className='italic text-muted-foreground/60'>
            {options.placeholder ?? 'Add notes...'}
          </span>
        )}
      </button>
    )
  }

  EditableCellComponent.displayName =
    `EditableCell(${String(prop)})`
  return EditableCellComponent
}

export interface UserCellOptions<T> {
  getName: (row: T) => string | null | undefined
  getPhotoUrl?: (row: T) => string | null | undefined
  getSecondary?: (row: T) => string | null | undefined
  /**
   * Builds a final same-origin path. Invalid or external values render as
   * plain text. Capture route context outside the cell if it is needed.
   */
  getHref?: (row: T) => string | null | undefined
}

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return initials || '—'
}

export const createUserCell = <T,>(options: UserCellOptions<T>) => {
  const UserCellComponent = (
    context: CellContext<T, unknown>
  ) => {
    const row = context.row.original
    const name = options.getName(row) ?? '—'
    const photoUrl = options.getPhotoUrl?.(row) ?? null
    const secondary = options.getSecondary?.(row) ?? null
    const href = toSafeInternalHref(options.getHref?.(row) ?? '')

    return (
      <div className='flex items-center gap-3'>
        <Avatar className='size-9 shrink-0 border border-foreground/10 bg-background text-foreground shadow-sm dark:border-white/10 dark:bg-dark-table'>
          <AvatarImage alt='' src={photoUrl ?? undefined} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-col'>
          {href ? (
            <Link
              href={href}
              className='w-[35ch] max-w-[35ch] truncate font-figtree text-sm uppercase hover:text-mac-blue'>
              {name}
            </Link>
          ) : (
            <span className='w-[35ch] max-w-[35ch] truncate font-figtree text-sm uppercase'>
              {name}
            </span>
          )}
          {secondary ? (
            <span className='truncate font-mono text-xs text-muted-foreground'>
              {secondary}
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  UserCellComponent.displayName = 'UserCell'
  return UserCellComponent
}

export interface DefaultUserCellRow {
  name?: string | null
  pictureUrl?: string | null
  email?: string | null
}

export const UserCell = createUserCell<DefaultUserCellRow>({
  getName: (user) => user.name,
  getPhotoUrl: (user) => user.pictureUrl,
  getSecondary: (user) => user.email
})

export const UserProfileCell = UserCell
