'use client'

import {
  createPaymentQRCodeSvg,
  PaymentQRExportSurface
} from '@/components/qrcode/payment-export-surface'
import { Button } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import { createPngFilename, downloadElementAsPng } from '@/lib/tickets/download-ticket-png'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ManualPaymentMethod } from './payments'

interface PaymentQRCodeProps {
  paymentMethod: ManualPaymentMethod
}

export const PaymentQRCode = ({ paymentMethod }: PaymentQRCodeProps) => {
  const exportRef = useRef<HTMLDivElement>(null)
  const exportLockRef = useRef(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const qrCodeContent = paymentMethod.qrCodeContent?.trim() ?? ''
  const qrSvg = useMemo(() => createPaymentQRCodeSvg(qrCodeContent), [qrCodeContent])

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
      <PaymentQRExportSurface
        ref={exportRef}
        accountName={paymentMethod.accountName}
        accountNumber={paymentMethod.accountNumber}
        bankOrEwallet={paymentMethod.bankOrEwallet}
        qrCodeImageUrl={paymentMethod.qrCodeImageUrl}
        qrSvg={qrSvg}
      />

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
