'use client'
import { Privacy, Purchase, Tos } from '@/legal'
import { components } from '@/mdx.components'
import { type JSX, useCallback, useEffect } from 'react'
import { SpaceX } from '../_components/spacex'

export const Content = ({ slug }: { slug: string }) => {
  const fetchDoc = useCallback(async () => await import(`@/legal/${slug}.mdx`), [slug])

  const docMap: Record<string, JSX.Element> = {
    'terms-of-use': <Tos components={components} />,
    'privacy-policy': <Privacy components={components} />,
    'purchase-agreement': <Purchase components={components} />
  }

  useEffect(() => {
    // Ensure the MDX chunk is loaded (helps avoid a blank print on slow devices).
    fetchDoc()
  }, [fetchDoc])
  return (
    <main
      id='legal-scroll-container'
      className='h-screen overflow-y-scroll print:h-auto! print:max-h-none! print:overflow-visible! print:mb-24'>
      <SpaceX />
      {docMap[slug]}
      <SpaceX />
    </main>
  )
}
