'use client'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon, IconName } from '@/lib/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

interface LegalDocument {
  slug: string
  title: string
  description: string
  icon: IconName
}

export const Content = () => {
  const documents = useMemo(
    () =>
      [
        {
          slug: 'terms-of-use',
          title: 'Terms of Use',
          description: 'Our terms for using this website.',
          icon: 'check'
        },
        {
          slug: 'privacy-policy',
          title: 'Privacy Policy',
          description: 'How we manage your information',
          icon: 'check'
        },
        {
          slug: 'purchase-agreement',
          title: 'Purchase Agreement',
          description: 'Policies regarding purchases and returns',
          icon: 'check'
        }
      ] as LegalDocument[],
    []
  )

  const router = useRouter()

  return (
    <main className='min-h-screen bg-background fontfont-figtree'>
      <div className='mx-auto max-w-6xl px-4 py-4 md:py-16 sm:px-6 lg:px-8'>
        <div className='max-w-5xl mx-auto mb-4 md:mb-12'>
          <div className='w-fit mb-2 font-bold text-foreground tracking-tight'>
            <Icon
              name='foreplay'
              onClick={() => router.push('/')}
              className='h-10 w-16 m:w-20 opacity-50 cursor-pointer hover:opacity-100 hover:text-primary'
            />
            <h1 className='font-okx text-3xl md:text-4xl tracking-tight'>Legal Resources</h1>
          </div>

          <p className='text-sm md:text-base'>Access our terms, privacy, and purchase agreement.</p>
        </div>

        <div className='grid gap-6 md:grid-cols-3'>
          {documents.map((doc) => (
            <Link key={doc.slug} href={`/${doc.slug}`}>
              <Card className='dark:bg-origin rounded-4xl md:py-8 md:px-4 h-44 md:h-80 flex flex-col justify-center space-y-2'>
                <CardHeader>
                  <div className='mb-4 md:mb-2 inline-flex w-fit rounded-2xl bg-origin/20 dark:bg-background/10 p-2 md:p-4'>
                    <Icon name={doc.icon} className='size-6' />
                  </div>
                  <div className='h-full md:h-20 flex flex-col justify-center font-figtree'>
                    <CardTitle className='md:text-xl tracking-tight mb-1 capitalize'>
                      {doc.slug.split('-').join(' ')}
                    </CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Button size='lg' variant='default' className='w-full md:flex hidden'>
                    Read
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
