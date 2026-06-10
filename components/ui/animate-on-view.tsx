'use client'

import gsap from 'gsap'
import { useLayoutEffect, useRef, type PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

type AnimateOnViewProps = PropsWithChildren<{
  className?: string
}>

export function AnimateOnView({ children, className }: AnimateOnViewProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const played = useRef(false)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || played.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          played.current = true
          observer.disconnect()

          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.set(node, { autoAlpha: 1, y: 0, clearProps: 'transform,opacity,filter' })
            return
          }

          gsap.fromTo(
            node,
            { autoAlpha: 0, scale: 0.985, rotate: -0.25, filter: 'blur(8px)', transformOrigin: '50% 50%' },
            {
              autoAlpha: 1,
              scale: 1,
              rotate: 0,
              filter: 'blur(0px)',
              duration: 0.75,
              ease: 'power2.out',
              clearProps: 'transform,opacity,filter'
            }
          )
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  )
}
