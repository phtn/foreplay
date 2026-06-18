'use client'

import gsap from 'gsap'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type ClassName } from '@/types'
import { type FC, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

interface HyperListProps<T> {
  keyId?: keyof T
  component: FC<T>
  data: T[] | undefined
  container?: ClassName
  itemStyle?: ClassName
  reversed?: boolean
  orderBy?: keyof T
  max?: number
  children?: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  disableAnimation?: boolean
  withExitAnimation?: boolean
}

type HyperListEntry<T> = {
  key: string
  item: T
}

const ENTRY_OFFSETS = {
  down: { opacity: 0, y: -10 },
  up: { opacity: 0, y: 10 },
  left: { opacity: 0, x: 10 },
  right: { opacity: 0, x: -10 }
} as const

const EXIT_OFFSETS = {
  down: { y: 40 },
  up: { y: -40 },
  left: { x: -20 },
  right: { x: 20 }
} as const

function getItemKey<T extends object>(item: T, index: number, keyId?: keyof T) {
  if (keyId !== undefined && keyId in item) {
    return String(item[keyId])
  }

  return String(index)
}

function sortEntries<T extends object>(items: T[], orderBy: keyof T) {
  return items.slice().sort((a, b) => {
    if (orderBy in b && orderBy in a) {
      return Number(b[orderBy]) - Number(a[orderBy])
    }

    return 0
  })
}

function buildEntries<T extends object>(props: {
  data: T[] | undefined
  keyId?: keyof T
  max: number
  orderBy: keyof T
  reversed: boolean
}) {
  const { data, keyId, max, orderBy, reversed } = props
  const sliced = reversed ? data?.slice(0, max).reverse() : data?.slice(0, max)
  const sorted = sliced ? sortEntries(sliced, orderBy) : []

  return sorted.map((item, index) => ({
    item,
    key: getItemKey(item, index, keyId)
  }))
}

export const HyperList = <T extends object>(props: HyperListProps<T>) => {
  const {
    component: Item,
    container = '',
    children,
    data,
    delay = 0,
    direction = 'down',
    itemStyle,
    keyId,
    max = 15,
    orderBy,
    reversed = false,
    disableAnimation = false,
    withExitAnimation = false,
    duration = 0.5
  } = props

  const resolvedOrderBy = (orderBy ?? ('updated_at' as keyof T)) as keyof T

  const itemRefs = useRef(new Map<string, HTMLLIElement>())
  const reducedMotionRef = useRef(false)
  const lastRenderedSignature = useRef('')
  const [renderedEntries, setRenderedEntries] = useState<HyperListEntry<T>[]>(() =>
    buildEntries({
      data,
      keyId,
      max,
      orderBy: resolvedOrderBy,
      reversed
    })
  )

  const baseContainerStyle = useMemo(() => {
    // Don't add overflow-y-auto if container has grid classes.
    const hasGrid = container.includes('grid')
    return hasGrid ? container : `${container} overflow-y-auto`
  }, [container])

  const baseItemStyle = useMemo(() => `${itemStyle} group/list`, [itemStyle])

  const resolvedEntries = useMemo(
    () =>
      buildEntries({
        data,
        keyId,
        max,
        orderBy: resolvedOrderBy,
        reversed
      }),
    [data, keyId, max, resolvedOrderBy, reversed]
  )

  useEffect(() => {
    reducedMotionRef.current = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  }, [])

  useLayoutEffect(() => {
    const nextSignature = resolvedEntries.map((entry) => entry.key).join('|')

    if (nextSignature === lastRenderedSignature.current) {
      return
    }

    const currentSignature = renderedEntries.map((entry) => entry.key).join('|')
    const nextKeys = new Set(resolvedEntries.map((entry) => entry.key))
    const removedEntries = renderedEntries.filter((entry) => !nextKeys.has(entry.key))
    const shouldAnimate = !disableAnimation && !reducedMotionRef.current

    if (!shouldAnimate || (removedEntries.length === 0 && currentSignature === nextSignature)) {
      lastRenderedSignature.current = nextSignature
      requestAnimationFrame(() => {
        setRenderedEntries(resolvedEntries)
      })
      return
    }

    if (removedEntries.length > 0 && withExitAnimation) {
      let remaining = removedEntries.length

      removedEntries.forEach((entry) => {
        const node = itemRefs.current.get(entry.key)

        if (!node) {
          remaining -= 1
          if (remaining === 0) {
            lastRenderedSignature.current = nextSignature
            requestAnimationFrame(() => {
              setRenderedEntries(resolvedEntries)
            })
          }
          return
        }

        gsap.to(node, {
          ...EXIT_OFFSETS[direction],
          opacity: 0,
          duration: 0.2,
          ease: 'power1.in',
          onComplete: () => {
            remaining -= 1
            if (remaining === 0) {
              lastRenderedSignature.current = nextSignature
              requestAnimationFrame(() => {
                setRenderedEntries(resolvedEntries)
              })
            }
          }
        })
      })

      return
    }

    lastRenderedSignature.current = nextSignature
    requestAnimationFrame(() => {
      setRenderedEntries(resolvedEntries)
    })
  }, [disableAnimation, direction, renderedEntries, resolvedEntries, withExitAnimation])

  useLayoutEffect(() => {
    if (disableAnimation || reducedMotionRef.current) {
      return
    }

    renderedEntries.forEach((entry, index) => {
      const node = itemRefs.current.get(entry.key)

      if (!node) {
        return
      }

      gsap.fromTo(
        node,
        ENTRY_OFFSETS[direction],
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration,
          delay: index * 0.05 + delay,
          ease: 'power2.out',
          clearProps: 'transform,opacity'
        }
      )
    })
  }, [delay, direction, disableAnimation, duration, renderedEntries])

  return (
    <ScrollArea>
      {children}
      <ul className={baseContainerStyle}>
      {renderedEntries.map((entry) => (
          <li
            key={entry.key}
            ref={(node) => {
              if (node) {
                itemRefs.current.set(entry.key, node)
                return
              }

              itemRefs.current.delete(entry.key)
            }}
            className={baseItemStyle}>
            <Item {...entry.item} />
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
