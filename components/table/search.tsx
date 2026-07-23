import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Input } from '@base-ui/react'
import type { Column } from '@tanstack/react-table'
import {
  useEffect,
  useEffectEvent,
  useId,
  memo,
  useRef,
  type ChangeEvent,
  type RefObject
} from 'react'
import { TABLE_QUERY_LIMITS } from './parsers'

interface Props<T> {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onClear?: VoidFunction
  value: string
  col?: Column<T, unknown>
  ref?: RefObject<HTMLInputElement | null>
}

const SearchComponent = ({
  col,
  value,
  onChange,
  onClear,
  ref
}: Props<unknown>) => {
  const id = useId()
  const fallbackRef = useRef<HTMLInputElement>(null)
  const inputRef = ref ?? fallbackRef
  const hasValue =
    value.trim().length > 0 || Boolean(col?.getFilterValue?.()?.toString())

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented) return

    const target = event.target
    const isTyping =
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)

    if (
      event.key === '/' &&
      !isTyping &&
      inputRef.current &&
      document.activeElement !== inputRef.current
    ) {
      event.preventDefault()
      inputRef.current.focus()
    }
  })

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  return (
    <div className='relative w-full min-w-0 md:w-auto'>
      <Input
        id={id}
        ref={inputRef}
        className={cn(
          'peer h-8 w-full min-w-0 rounded-sm border-none bg-sidebar ps-3 font-brk text-sm outline-0 placeholder:font-brk placeholder:text-foreground/60 md:w-48 md:min-w-60 dark:bg-background/40',
          hasValue && 'pe-10'
        )}
        value={value}
        onChange={onChange}
        maxLength={TABLE_QUERY_LIMITS.searchCharacters}
        placeholder='Search'
        type='search'
        inputMode='search'
        aria-label='Search'
      />
      <div className='pointer-events-none absolute inset-y-0 inset-e-0 flex items-center justify-center pe-2 text-foreground/80 peer-disabled:opacity-50'>
        <Icon name='slash' aria-hidden='true' className='size-5' />
      </div>
      {hasValue ? (
        <button
          type='button'
          className='absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
          aria-label='Clear filter'
          onClick={() => {
            col?.setFilterValue('')
            onClear?.()
            inputRef.current?.focus()
          }}>
          <Icon name='x' size={16} aria-hidden='true' />
        </button>
      ) : null}
    </div>
  )
}

SearchComponent.displayName = 'SearchFilter'

export const Search = memo(SearchComponent)
