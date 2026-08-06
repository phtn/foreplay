'use client'
import { Button } from '@/components/ui/button'
import type { Heading } from '@/legal/documents'
import { legalDocuments } from '@/legal/documents'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { SpaceX } from '../_components/spacex'
import { TocDrawer } from '../_components/toc-drawer'

interface LegalDocumentLayoutProps {
  children?: ReactNode
}

function slugifyForId(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function LegalDocumentLayout({ children }: LegalDocumentLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const route = usePathname().split('/').pop()
  const contentRootRef = useRef<HTMLElement | null>(null)
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

  const handlePrint = () => {
    // Ensure overlays are closed and print styles apply.
    startTransition(() => {
      setIsDrawerOpen(false)
    })

    const scroller = document.getElementById('legal-scroll-container')
    if (!scroller) {
      window.requestAnimationFrame(() => window.print())
      return
    }

    // Print a clean "document" (iframe) so scroll containers and app shell
    // can't clip the printed output.
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.tabIndex = -1
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'

    document.body.appendChild(iframe)

    const doc = iframe.contentDocument
    const win = iframe.contentWindow
    if (!doc || !win) {
      document.body.removeChild(iframe)
      window.requestAnimationFrame(() => window.print())
      return
    }

    const headPieces = Array.from(
      document.head.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style')
    ).map((el) => el.outerHTML)

    const extraPrintCss = `
<style>
@page {
  /* top right bottom left */
  margin: 0.5in 0.5in 1in 0.5in;
}
@media print {
  html, body {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;

  }
  #legal-scroll-container {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    margin-bottom: 1in !important;
  }
}
</style>
`

    doc.open()
    doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    ${headPieces.join('\n')}
    ${extraPrintCss}
  </head>
  <body>
    ${scroller.outerHTML}
  </body>
</html>`)
    doc.close()

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }

    // Give styles/fonts a beat to apply before printing.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          try {
            win.focus()
            win.print()
          } finally {
            cleanup()
          }
        }, 50)
      })
    })
  }

  const currentDoc = legalDocuments.find((doc) => doc.slug === route)

  const docWithHeadings = useMemo(() => {
    if (!currentDoc) return undefined
    return { ...currentDoc, headings }
  }, [currentDoc, headings])

  useEffect(() => {
    const root = contentRootRef.current
    if (!root) return

    let disposed = false
    let scheduled: number | null = null

    const collect = () => {
      if (disposed) return

      const elements = Array.from(root.querySelectorAll<HTMLHeadingElement>('h2, h3')).filter(
        (el) => el.textContent && el.offsetParent !== null
      )

      const seen = new Map<string, number>()
      const nextHeadings: Heading[] = []

      for (const el of elements) {
        const text = (el.textContent ?? '').trim()
        if (!text) continue

        const baseId = el.id?.trim() || slugifyForId(text)
        if (!baseId) continue

        const count = seen.get(baseId) ?? 0
        seen.set(baseId, count + 1)

        const id = count === 0 ? baseId : `${baseId}-${count + 1}`
        if (el.id !== id) el.id = id

        const level = el.tagName === 'H2' ? 2 : 3
        nextHeadings.push({ id, text, level })
      }

      setHeadings(nextHeadings)
    }

    const scheduleCollect = () => {
      if (scheduled !== null) window.clearTimeout(scheduled)
      scheduled = window.setTimeout(collect, 0)
    }

    scheduleCollect()

    const observer = new MutationObserver(() => scheduleCollect())
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true
    })

    return () => {
      disposed = true
      if (scheduled !== null) window.clearTimeout(scheduled)
      observer.disconnect()
    }
  }, [route])

  useEffect(() => {
    const root = contentRootRef.current
    if (!root) return

    const scrollContainer = root.querySelector<HTMLElement>('#legal-scroll-container')
    if (!scrollContainer) return
    if (headings.length === 0) return

    const observed = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => Boolean(el))

    if (observed.length === 0) return

    // Pick the first heading as a safe initial value (e.g. when landing mid-page).
    startTransition(() => {
      setActiveHeadingId((prev) => prev ?? headings[0]?.id ?? null)
    })

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.target as HTMLElement).getBoundingClientRect().top -
              (b.target as HTMLElement).getBoundingClientRect().top
          )

        const next = visible[0]?.target as HTMLElement | undefined
        if (!next?.id) return

        startTransition(() => {
          setActiveHeadingId(next.id)
        })
      },
      {
        root: scrollContainer,
        // Account for the fixed header. Bottom margin makes the "active" window smaller
        // so we don't flicker between headings.
        rootMargin: '-48px 0px -70% 0px',
        threshold: 0
      }
    )

    for (const el of observed) observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [headings, route])

  return (
    <div className='h-screen bg-background print:h-auto! print:max-h-none! print:overflow-visible!'>
      {/* Header */}
      <header className='absolute w-full top-0 z-40 border-b border-border backdrop-blur-2xl supports-backdrop-filter:bg-origin/40 print:hidden'>
        <div className='flex h-16 items-center justify-between px-2 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-2 md:gap-4'>
            <Link
              href='/'
              className='inline-flex items-center justify-center rounded-md text-sm p-2 hover:bg-muted'
              aria-label='Back to Homepage'>
              <Icon name='chevron-right' className='size-5 -rotate-90' />
              <span className='opacity-80'>Home</span>
            </Link>

            <div className='hidden'>
              <h1 className='text-xs sm:text-sm md:text-xl opacity-70 capitalize font-medium font-figtree text-foreground tracking-tighter max-w-[8ch] md:leading-5 leading-4'>
                {route?.split('-').join(' ')}
              </h1>
            </div>
          </div>

          <Link href={`/`} className='flex items-center space-x-1'>
            <Image
              src='/apple-icon.png'
              alt='foreplay-wordmark'
              width={100}
              height={100}
              className='h-7 w-auto rounded-full'
              priority
              unoptimized
            />
            <h1 className='font-poly'>Foreplay</h1>
          </Link>

          <div className='flex items-center space-x-1 md:space-x-4'>
            <Button
              variant='ghost'
              onClick={handlePrint}
              className='inline-flex items-center gap-2 rounded-md px-3 md:px-4 py-2 text-sm font-medium print:hidden'
              aria-label='Print document'>
              <Icon name='print' className='size-5 opacity-70' />
            </Button>
            <button
              onClick={() => startTransition(() => setIsDrawerOpen(true))}
              className='inline-flex items-center justify-center rounded-md p-2 hover:bg-muted lg:hidden'
              aria-label='Toggle table of contents'>
              <Icon name='list-dot-line' className='size-5 opacity-70' />
            </button>
          </div>
        </div>
      </header>

      <div className='flex print:block'>
        {/* TOC Drawer for mobile */}
        <TocDrawer
          isOpen={isDrawerOpen}
          onOpenChange={(open) =>
            startTransition(() => {
              setIsDrawerOpen(open)
            })
          }
          document={docWithHeadings}
          activeId={activeHeadingId ?? undefined}
        />

        {/* Main content */}
        <main
          ref={contentRootRef}
          className='h-fit flex-1 mx-auto md:max-w-160 lg:max-w-180 xl:max-w-200 2xl:max-w-240 px-4 sm:px-6 lg:px-8 print:h-auto! print:max-h-none! print:overflow-visible! print:mb-24!'>
          {children}
        </main>

        <aside className='absolute left-0 hidden xl:w-72 2xl:w-96 md:h-screen overflow-y-scroll border-r border-border bg-muted/30 p-6 lg:block print:hidden'>
          <SpaceX />
          <div className='sticky top-8 font-figtree'>
            <div className='mb-8 opacity-60 tracking-wider uppercase text-xs'>Resources</div>

            {legalDocuments.map((doc) => (
              <Link
                key={doc.slug}
                href={`/${doc.slug}`}
                className='w-fit group flex items-center justify-between bg-background transition-all hover:border-primary-hover hover:bg-muted/60 mb-2 md:mb-3'>
                <div>
                  <p
                    className={cn(
                      'font-semibold text-foreground group-hover:text-mac-blue dark:group-hover:text-primary-hover',
                      {
                        'text-mac-blue dark:text-primary-hover underline underline-offset-4 decoration-dotted':
                          doc.slug === route
                      }
                    )}>
                    {doc.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <SpaceX />
        </aside>

        {/* Desktop TOC Sidebar */}
        <aside className='absolute right-0 hidden xl:w-72 2xl:w-96 md:h-screen overflow-y-scroll border-l border-border bg-foreground/2 lg:block print:hidden p-6'>
          <SpaceX />
          <div className='sticky top-8 font-okx'>
            <div className='mb-8 opacity-60 tracking-wider uppercase text-xs'>Table of Contents</div>

            <nav className='space-y-3 text-sm'>
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById(heading.id)
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className={cn(
                    'block truncate rounded font-figtree tracking-tight px-2 py-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground',
                    heading.level === 2 ? 'font-medium' : 'ml-2',
                    heading.id === activeHeadingId &&
                      'bg-background text-mac-blue underline decoration-dotted dark:text-primary-hover'
                  )}>
                  <span>{heading.text}</span>
                </a>
              ))}
            </nav>
          </div>
          <SpaceX />
        </aside>
      </div>
    </div>
  )
}
