'use client'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Icon } from '@/lib/icons'

interface EventQrDrawerProps {
  eventTitle: string
  fileName: string
  qrSvg: string
  tournamentUrl: string
}

export function EventQrDrawer({ eventTitle, fileName, qrSvg, tournamentUrl }: EventQrDrawerProps) {
  const downloadQrCode = () => {
    const qrBlob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' })
    const downloadUrl = URL.createObjectURL(qrBlob)
    const downloadLink = document.createElement('a')

    downloadLink.href = downloadUrl
    downloadLink.download = fileName
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
  }

  return (
    <Drawer swipeDirection='right'>
      <Tooltip>
        <TooltipTrigger
          delay={150}
          render={
            <DrawerTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  className='rounded-full text-sky-600 hover:text-sky-500'
                  aria-label={`Show QR code for ${eventTitle}`}>
                  <Icon name='qrcode' className='size-5' />
                </Button>
              }
            />
          }
        />
        <TooltipContent side='top'>Event QR code</TooltipContent>
      </Tooltip>

      <DrawerContent className='[--drawer-content-width:calc(100vw-1rem)] sm:[--drawer-content-width:44rem] rounded-xl'>
        <DrawerHeader className='flex-row items-start justify-between gap-4 border-b border-border/60 pb-4 text-left'>
          <div className='min-w-0 space-y-1'>
            <p className='font-ios text-xs uppercase tracking-widest text-sky-700 dark:text-sky-400'>Event QR code</p>
            <DrawerTitle className='truncate font-poly text-xl'>{eventTitle}</DrawerTitle>
            <DrawerDescription className='truncate font-ios text-xs tracking-wider'>
              Public tournament page
            </DrawerDescription>
          </div>

          <DrawerClose
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='shrink-0 rounded-full'
                aria-label='Close event QR code'>
                <Icon name='close' className='size-4' />
              </Button>
            }
          />
        </DrawerHeader>

        <div className='min-h-0 flex-1 overflow-y-auto bg-slate-950/5 p-4 sm:p-5'>
          <div className='flex min-h-full flex-col items-center justify-center gap-5'>
            <div className='w-full max-w-sm rounded-2xl border border-border/70 bg-white p-5 shadow-sm'>
              <div
                role='img'
                aria-label={`QR code for ${eventTitle}`}
                className='aspect-square w-full [&_svg]:size-full'
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>

            <div className='w-full max-w-sm space-y-2 rounded-xl border border-border/60 bg-background p-4'>
              <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>Destination</p>
              <a
                href={tournamentUrl}
                target='_blank'
                rel='noreferrer'
                className='block break-all text-sm font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-300'>
                {tournamentUrl}
              </a>
              <p className='text-xs leading-5 text-muted-foreground'>
                Scanning this code opens the public tournament page.
              </p>
            </div>
          </div>
        </div>

        <DrawerFooter className='grid gap-2 border-t border-border/70 p-4 sm:grid-cols-2'>
          <Button
            type='button'
            className='h-12 gap-2 font-poly bg-foreground hover:bg-foreground/80 text-background'
            onClick={downloadQrCode}>
            <Icon name='down-to-line' className='size-4' />
            Download QR
          </Button>
          <DrawerClose
            render={
              <Button type='button' variant='ghost' className='h-12 font-poly'>
                Close
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
