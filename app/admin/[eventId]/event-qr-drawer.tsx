'use client'

import { downloadSvgAsPng } from '@/components/qrcode/download-png'
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
import { useState, useTransition } from 'react'

interface EventQrDrawerProps {
  eventTitle: string
  fileName: string
  qrSvg: string
  tournamentUrl: string
}

export function EventQrDrawer({ eventTitle, fileName, qrSvg, tournamentUrl }: EventQrDrawerProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isDownloadingPng, startPngDownload] = useTransition()

  const downloadSvgQrCode = () => {
    setDownloadError(null)

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

  const downloadPngQrCode = () => {
    if (isDownloadingPng) return

    setDownloadError(null)
    startPngDownload(async () => {
      try {
        const pngFileName = /\.svg$/i.test(fileName) ? fileName.replace(/\.svg$/i, '.png') : `${fileName}.png`
        await downloadSvgAsPng(qrSvg, pngFileName, {
          height: 720,
          width: 720
        })
      } catch (error) {
        console.error('Unable to download the event QR code as PNG.', error)
        setDownloadError('Unable to create the PNG. Please try again.')
      }
    })
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

      <DrawerContent className='[--drawer-content-width:calc(100vw-1rem)] sm:[--drawer-content-width:44rem] rounded-lg'>
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
          <Button type='button' variant='outline' className='h-12 gap-2 font-poly' onClick={downloadSvgQrCode}>
            <Icon name='down-to-line' className='size-4' />
            Download SVG
          </Button>
          <Button
            type='button'
            className='h-12 gap-2 bg-foreground font-poly text-background hover:bg-foreground/80'
            disabled={isDownloadingPng}
            onClick={downloadPngQrCode}>
            <Icon name={isDownloadingPng ? 'spinner-ring' : 'down-to-line'} className='size-4' />
            {isDownloadingPng ? 'Creating PNG' : 'Download PNG'}
          </Button>
          {downloadError ? (
            <p role='alert' className='text-sm text-destructive sm:col-span-2'>
              {downloadError}
            </p>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
