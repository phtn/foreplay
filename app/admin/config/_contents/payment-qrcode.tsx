'use client'

import { createQRCodeSvg } from '@/components/qrcode/viewer'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { createPngFilename, downloadElementAsPng } from '@/lib/tickets/download-ticket-png'
import Image from 'next/image'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ManualPaymentMethod } from './payments'

const PAYMENT_QR_SOURCE_SIZE = 512

interface PaymentQRCodeProps {
  paymentMethod: ManualPaymentMethod
}

export const PaymentQRCode = ({ paymentMethod }: PaymentQRCodeProps) => {
  const exportRef = useRef<HTMLDivElement>(null)
  const exportLockRef = useRef(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const qrCodeContent = paymentMethod.qrCodeContent?.trim() ?? ''
  const qrSvg = useMemo(() => {
    if (!qrCodeContent) {
      return null
    }

    try {
      return createQRCodeSvg({
        content: qrCodeContent,
        width: PAYMENT_QR_SOURCE_SIZE,
        height: PAYMENT_QR_SOURCE_SIZE,
        container: 'svg-viewbox',
        join: true
      })
    } catch {
      return null
    }
  }, [qrCodeContent])

  const handleDownload = useCallback(async () => {
    if (!exportRef.current || exportLockRef.current || isDownloading) {
      return
    }

    setDownloadError(null)
    exportLockRef.current = true
    setIsDownloading(true)

    try {
      await downloadElementAsPng(
        exportRef.current,
        createPngFilename(
          `foreplay-payment-${paymentMethod.bankOrEwallet}-${paymentMethod.accountName}`,
          `foreplay-payment-${paymentMethod._id}`
        )
      )
    } catch (error) {
      console.error('Unable to export the payment QR code.', error)
      setDownloadError('Unable to download this payment QR. Please try again.')
    } finally {
      exportLockRef.current = false
      setIsDownloading(false)
    }
  }, [isDownloading, paymentMethod._id, paymentMethod.accountName, paymentMethod.bankOrEwallet])

  return (
    <div className='mx-auto grid w-full max-w-sm gap-3'>
      <div ref={exportRef} data-ticket-export-root className='overflow-hidden bg-white'>
        <div className='flex min-w-0 flex-col items-center px-6 py-4 text-center sm:px-7 sm:py-7'>
          <div className='my-2 min-w-0 max-w-full'>
            <p className='wrap-break-word font-poly text-xs font-medium uppercase tracking-[0.24em] text-slate-600'>
              {paymentMethod.accountName}
            </p>
            <p className='mt-1 wrap-break-word font-ios text-xs uppercase tracking-[0.16em] text-zinc-600'>
              {paymentMethod.bankOrEwallet} · {paymentMethod.accountNumber}
            </p>
          </div>

          <div
            role='img'
            aria-label={`Payment QR code for ${paymentMethod.accountName}`}
            className='my-2 flex aspect-square w-full max-w-72 items-center justify-center overflow-hidden rounded-4xl border-2 border-primary/33 bg-white p-3'>
            {qrSvg ? (
              <div className='size-full [&_svg]:size-full' dangerouslySetInnerHTML={{ __html: qrSvg }} />
            ) : paymentMethod.qrCodeImageUrl ? (
              <Image
                src={paymentMethod.qrCodeImageUrl}
                alt=''
                width={PAYMENT_QR_SOURCE_SIZE}
                height={PAYMENT_QR_SOURCE_SIZE}
                unoptimized
                className='size-full object-contain'
              />
            ) : (
              <div className='flex flex-col items-center gap-2 text-slate-300'>
                <Icon name='qrcode' className='size-12' />
                <span className='font-ios text-[8px] uppercase tracking-[0.18em]'>QR unavailable</span>
              </div>
            )}
          </div>

          <div className='flex items-center'>
            <p className='font-ios text-[8px] tracking-wide text-slate-500'>foreplay.pro</p>
          </div>
        </div>
      </div>

      <Button
        type='button'
        variant='ghost'
        className='h-11 w-full justify-center'
        disabled={isDownloading || (!qrSvg && !paymentMethod.qrCodeImageUrl)}
        onClick={() => {
          void handleDownload()
        }}>
        <Icon name={isDownloading ? 'spinner-ring' : 'down-to-line'} className='size-4' />
        <span>{isDownloading ? 'Creating QR' : 'Download'}</span>
      </Button>

      {downloadError ? (
        <p role='alert' className='text-center text-sm text-destructive'>
          {downloadError}
        </p>
      ) : null}
    </div>
  )
}
