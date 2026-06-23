'use client'

import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import html2canvas from 'html2canvas'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { createQRCodeSvg, QRCodeSVG, type QRCodeOptions } from './viewer'

export const DisplayQRCode = () => {
  // Find the QR card
  const qrUrl = useMemo(() => {
    return `00020101021127590012com.p2pqrpay0111GOTYPHM2XXX02089996440304120113505139755204601653036085802PH5921MARLON JOAKIM TABLIZO6013Caloocan City6304B9FD`
  }, [])

  // QR code options
  const qrOptions = useMemo<QRCodeOptions | null>(() => {
    if (!qrUrl) return null
    return {
      content: qrUrl,
      width: 400,
      height: 400
    }
  }, [qrUrl])

  const svgData = useMemo(() => {
    if (!qrOptions) {
      return ''
    }

    try {
      return createQRCodeSvg(qrOptions)
    } catch (error) {
      console.error('Failed to generate QR code SVG:', error)
      return ''
    }
  }, [qrOptions])
  const qrRef = useRef<HTMLDivElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Generate image from SVG for download/print/share
  const generateImage = useCallback(async () => {
    if (imageUrl) {
      return imageUrl
    }

    // Use SVG data directly if available
    if (svgData) {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        const size = 400
        canvas.width = size
        canvas.height = size

        const img = new Image()
        const svgBlob = new Blob([svgData], {
          type: 'image/svg+xml;charset=utf-8'
        })
        const url = URL.createObjectURL(svgBlob)

        return new Promise<string>((resolve, reject) => {
          img.onload = () => {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            const dataUrl = canvas.toDataURL('image/png')
            URL.revokeObjectURL(url)
            setImageUrl(dataUrl)
            resolve(dataUrl)
          }
          img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load SVG'))
          }
          img.src = url
        })
      } catch (error) {
        console.error('Failed to generate image from SVG:', error)
      }
    }

    // Fallback to html2canvas
    if (!qrRef.current) return null

    const clonedElement = qrRef.current.cloneNode(true) as HTMLElement
    clonedElement.style.position = 'absolute'
    clonedElement.style.left = '-9999px'
    clonedElement.style.top = '-9999px'
    document.body.appendChild(clonedElement)

    clonedElement.style.background = '#ffffff'

    const fixElementStyles = (element: HTMLElement) => {
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.color && (computedStyle.color.includes('oklch') || computedStyle.color.includes('lab'))) {
        element.style.color = '#000000'
      }
      if (
        computedStyle.backgroundColor &&
        (computedStyle.backgroundColor.includes('oklch') || computedStyle.backgroundColor.includes('lab'))
      ) {
        element.style.backgroundColor = '#ffffff'
      }
      Array.from(element.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          fixElementStyles(child)
        }
      })
    }

    fixElementStyles(clonedElement)

    const html2canvasOptions = {
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scale: 2,
      allowTaint: false
    }

    try {
      const canvas = await html2canvas(clonedElement, html2canvasOptions)
      const dataUrl = canvas.toDataURL('image/png')
      document.body.removeChild(clonedElement)
      setImageUrl(dataUrl)
      return dataUrl
    } catch (error) {
      if (document.body.contains(clonedElement)) {
        document.body.removeChild(clonedElement)
      }
      console.error('Failed to generate image:', error)
      throw error
    }
  }, [imageUrl, svgData])

  const handleDownload = useCallback(async () => {
    if (!qrRef.current) return
    const image = await generateImage()
    if (image) {
      const link = document.createElement('a')
      link.href = image
      link.download = `qr-code.png`
      link.click()
    }
  }, [generateImage])

  const handleShare = useCallback(async () => {
    const image = await generateImage()
    if (image) {
      const response = await fetch(image)
      const blob = await response.blob()
      const file = new File([blob], `qr-code.png`, {
        type: 'image/png'
      })

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My QR Code',
            text: qrUrl ?? 'QR Code',
            files: [file]
          })
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error sharing QR code:', error)
            alert('Failed to share QR code. Try downloading instead.')
          }
        }
      } else {
        alert('Web Share API not supported in your browser. Try downloading instead.')
        await handleDownload()
      }
    }
  }, [generateImage, qrUrl, handleDownload])

  const handlePrint = useCallback(async () => {
    const image = await generateImage()
    if (image) {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Please allow pop-ups to print the QR code')
        return
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title> Payment - QR Code</title>
            <style>
              @media print {
                @page {
                  margin: 0;
                  size: auto;
                }
                body {
                  margin: 0;
                  padding: 20mm;
                }
              }
              body {
                margin: 0;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .qr-container {
                text-align: center;
              }
              .qr-image {
                max-width: 100%;
                height: auto;
                margin-bottom: 20px;
              }
              .qr-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #000;
              }
              .qr-url {
                font-size: 14px;
                color: #666;
                word-break: break-all;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-title">Payment QR Code</div>
              <img src="${image}" alt="QR Code" class="qr-image" />
              ${qrUrl ? `<div class="qr-url">${qrUrl}</div>` : ''}
            </div>
          </body>
        </html>
      `)

      printWindow.document.close()

      const waitForPrint = () => {
        if (printWindow.document.readyState === 'complete') {
          setTimeout(() => {
            printWindow.print()
          }, 500)
        } else {
          printWindow.addEventListener('load', () => {
            setTimeout(() => {
              printWindow.print()
            }, 500)
          })
        }
      }

      waitForPrint()
    }
  }, [generateImage, qrUrl])

  // Loading state
  if (!qrOptions) {
    return (
      <div className='flex items-center justify-center w-full h-full min-h-64'>
        <div className='flex flex-col items-center gap-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          <p className='text-muted-foreground'>Loading QR code...</p>
        </div>
      </div>
    )
  }

  // No QR code state
  if (!qrUrl || !qrOptions) {
    return (
      <div className='flex items-center justify-center w-full h-full min-h-64'>
        <div className='flex flex-col items-center gap-4 px-4'>
          <Icon name='re-up.ph' className='size-16 text-muted-foreground/50' />
          <div className='flex flex-col items-center gap-2 text-center'>
            <p className='text-sm font-medium text-foreground'>No QR code available</p>
            <p className='text-xs text-muted-foreground max-w-sm'>Engk</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center gap-6 w-full h-full overflow-y-auto py-4'>
      {/* QR Code Display */}
      <div className='flex flex-col items-center gap-4'>
        <div
          ref={qrRef}
          className={cn('flex items-center justify-center rounded-lg border border-gray-100 bg-white p-4 shadow-lg')}>
          <QRCodeSVG className='size-[280.01px] md:size-[400.01px] [&_svg]:size-full' options={qrOptions} />
        </div>
        {/* User Info */}
        {/*{userProfile.displayName && (
          <div className='flex flex-col items-center gap-1'>
            <h2 className='text-2xl font-semibold tracking-tighter'>{userProfile.displayName}</h2>

            {userProfile.username && (
              <p className='mb-2 opacity-80 text-lg tracking-tighter leading-relaxed font-space'>
                @{userProfile.username}
              </p>
            )}
          </div>
        )}*/}
      </div>

      {/* Action Buttons */}
      <div className='flex flex-row gap-3 w-full max-w-sm'>
        <Button
          variant='ghost'
          onClick={handleShare}
          className='flex-1 px-4 py-3 flex items-center justify-center space-x-2'>
          <span className='text-sm font-medium'>Share</span>
        </Button>

        <Button
          variant='ghost'
          onClick={handleDownload}
          className='flex-1 px-4 py-3 flex items-center justify-center space-x-2'>
          <span className='text-sm font-medium'>Download</span>
        </Button>

        <Button
          variant='ghost'
          onClick={handlePrint}
          className='flex-1 px-4 py-3 flex items-center justify-center space-x-2'>
          <span className='text-sm font-medium'>Print</span>
        </Button>
      </div>

      {/* QR URL Info */}
      {qrUrl && (
        <div className='w-full max-w-sm px-4'>
          <p className='text-xs text-muted-foreground text-center break-all font-space'>{qrUrl}</p>
        </div>
      )}
    </div>
  )
}
