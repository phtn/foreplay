'use client'

import type { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

const SPONSORS_PER_SLIDE = 2
const SPONSOR_CYCLE_DELAY_MS = 5_000
const SLIDE_TRANSITION = {
  duration: 0.45,
  ease: 'easeInOut'
} as const
const REDUCED_MOTION_TRANSITION = { duration: 0 } as const

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 72 : -72
  }),
  center: {
    opacity: 1,
    x: 0
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -72 : 72
  })
}

type TournamentSponsorList = NonNullable<Doc<'tournaments'>['sponsor_list']>
export type TournamentSponsor = TournamentSponsorList[number]

export function createSponsorSlides(sponsors: readonly TournamentSponsor[]) {
  const activeSponsors = sponsors.filter((sponsor) => sponsor.is_active !== false)

  if (activeSponsors.length === 0) {
    return []
  }

  if (activeSponsors.length <= SPONSORS_PER_SLIDE) {
    return [activeSponsors]
  }

  return Array.from({ length: Math.ceil(activeSponsors.length / SPONSORS_PER_SLIDE) }, (_, slideIndex) =>
    Array.from(
      { length: SPONSORS_PER_SLIDE },
      (_, sponsorIndex) => activeSponsors[(slideIndex * SPONSORS_PER_SLIDE + sponsorIndex) % activeSponsors.length]
    )
  )
}

function getSponsorHref(url: string | undefined) {
  if (!url) {
    return undefined
  }

  try {
    const sponsorUrl = new URL(url)
    return sponsorUrl.protocol === 'http:' || sponsorUrl.protocol === 'https:' ? sponsorUrl.toString() : undefined
  } catch {
    return undefined
  }
}

function SponsorTile({ sponsor }: { sponsor: TournamentSponsor }) {
  const href = getSponsorHref(sponsor.url)
  const content = (
    <div className='flex flex-col items-center justify-center'>
      <p className='font-ios text-xs uppercase tracking-[0.24em] sm:text-[10px] text-balance flex items-center'>
        <span
          className={cn('text-base', {
            'text-yellow-500': sponsor.label?.split(' ').shift()?.toLowerCase() === 'gold',
            'text-slate-400': sponsor.label?.split(' ').shift()?.toLowerCase() === 'platinum'
          })}>
          ⯌
        </span>
        <span>{sponsor.label ?? 'Official sponsor'}</span>
      </p>
      <p className='mt-3 wrap-break-word font-poly text-lg leading-tight sm:text-2xl md:text-3xl text-balance md:max-w-[20ch]'>
        {sponsor.value}
      </p>
      {href ? (
        <span className='mt-4 inline-flex items-center gap-1 font-ios text-[9px] uppercase tracking-[0.18em] text-primary'>
          Visit partner
          <Icon name='arrow-right' className='size-3' />
        </span>
      ) : null}
    </div>
  )
  const className = 'flex h-full min-w-0 flex-col justify-center rounded-xl px-3 py-5 text-center sm:px-6 sm:py-7'

  return href ? (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className={cn(
        className,
        'transition-colors hover:border-emerald-300/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70'
      )}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  )
}

interface SponsorsProps {
  sponsors: readonly TournamentSponsor[]
}

export function Sponsors({ sponsors }: SponsorsProps) {
  const slides = useMemo(() => createSponsorSlides(sponsors), [sponsors])
  const shouldReduceMotion = useReducedMotion() === true
  const [carouselState, setCarouselState] = useState({
    direction: 1,
    slideIndex: 0
  })
  const [pointerPaused, setPointerPaused] = useState(false)
  const [focusPaused, setFocusPaused] = useState(false)
  const slideCount = slides.length
  const activeSlideIndex = slideCount ? carouselState.slideIndex % slideCount : 0
  const activeSlide = slides[activeSlideIndex]
  const paused = pointerPaused || focusPaused

  useEffect(() => {
    if (slideCount <= 1 || paused || shouldReduceMotion) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCarouselState((current) => ({
        direction: 1,
        slideIndex: (current.slideIndex + 1) % slideCount
      }))
    }, SPONSOR_CYCLE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [activeSlideIndex, paused, shouldReduceMotion, slideCount])

  if (!activeSlide) {
    return null
  }

  const showSlide = (slideIndex: number, direction: number) => {
    setCarouselState({
      direction,
      slideIndex
    })
  }

  return (
    <section
      id='sponsors'
      aria-labelledby='sponsors-heading'
      aria-roledescription='carousel'
      className='mt-12 overflow-hidden rounded-[1.5rem] border dark:border-slate-600 bg-slate-50 dark:bg-transparent shadow-sm sm:mt-16'
      onMouseEnter={() => setPointerPaused(true)}
      onMouseLeave={() => setPointerPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusPaused(false)
        }
      }}>
      <div className='flex items-end justify-between gap-4 border-b border-border/50 dark:border-slate-600 border-dashed px-4 py-5 sm:px-7 sm:py-6'>
        <div>
          <p className='font-ios text-[10px] uppercase tracking-[0.28em] text-primary'>Supported by</p>
          <h2 id='sponsors-heading' className='mt-2 font-poly text-base md:text-lg tracking-[-0.02em] sm:text-xl'>
            Tournament Partners
          </h2>
        </div>

        {slideCount > 1 ? (
          <div className='flex shrink-0 items-center gap-2'>
            <button
              type='button'
              aria-label='Show previous sponsors'
              className='inline-flex size-9 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70'
              onClick={() => showSlide((activeSlideIndex - 1 + slideCount) % slideCount, -1)}>
              <Icon name='arrow-left' className='size-4' />
            </button>
            <button
              type='button'
              aria-label='Show next sponsors'
              className='inline-flex size-9 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70'
              onClick={() => showSlide((activeSlideIndex + 1) % slideCount, 1)}>
              <Icon name='arrow-right' className='size-4' />
            </button>
          </div>
        ) : null}
      </div>

      <div className='overflow-hidden p-3 sm:p-5'>
        <AnimatePresence custom={carouselState.direction} initial={false} mode='wait'>
          <motion.ul
            key={activeSlideIndex}
            role='group'
            aria-label={`Sponsor group ${activeSlideIndex + 1} of ${slideCount}`}
            aria-roledescription='slide'
            custom={carouselState.direction}
            variants={slideVariants}
            initial={shouldReduceMotion ? false : 'enter'}
            animate='center'
            exit={shouldReduceMotion ? 'center' : 'exit'}
            transition={shouldReduceMotion ? REDUCED_MOTION_TRANSITION : SLIDE_TRANSITION}
            className={cn(
              'grid min-h-36 gap-2 sm:min-h-44 sm:gap-4 divide-y md:divide-y-0',
              activeSlide.length === 1 ? 'grid-cols-1' : activeSlide.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2'
            )}>
            {activeSlide.map((sponsor, sponsorIndex) => (
              <li key={`${activeSlideIndex}-${sponsorIndex}-${sponsor.value}`} className='min-w-0 h-36'>
                <SponsorTile sponsor={sponsor} />
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {slideCount > 1 ? (
        <div aria-label='Choose a sponsor group' className='flex items-center justify-center gap-2 px-5 pb-5'>
          {slides.map((_, slideIndex) => (
            <button
              key={slideIndex}
              type='button'
              aria-label={`Show sponsor group ${slideIndex + 1}`}
              aria-current={slideIndex === activeSlideIndex ? 'true' : undefined}
              className={cn(
                'h-1.5 rounded-full transition-[width,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                slideIndex === activeSlideIndex ? 'w-7 bg-primary' : 'w-2 bg-slate-300 hover:bg-slate-300/60'
              )}
              onClick={() => showSlide(slideIndex, slideIndex >= activeSlideIndex ? 1 : -1)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
