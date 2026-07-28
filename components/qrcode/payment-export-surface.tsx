import { Icon } from '@/lib/icons'
import Image from 'next/image'
import type { Ref } from 'react'
import { createQRCodeSvg } from './viewer'

export const PAYMENT_QR_SOURCE_SIZE = 512

export function createPaymentQRCodeSvg(content: string | null | undefined) {
  const normalizedContent = content?.trim() ?? ''

  if (!normalizedContent) {
    return null
  }

  try {
    return createQRCodeSvg({
      content: normalizedContent,
      width: PAYMENT_QR_SOURCE_SIZE,
      height: PAYMENT_QR_SOURCE_SIZE,
      container: 'svg-viewbox',
      join: true
    })
  } catch {
    return null
  }
}

interface PaymentQRExportSurfaceProps {
  accountName: string
  accountNumber: string
  bankOrEwallet: string
  qrCodeImageUrl?: string | null
  qrSvg: string | null
  ref?: Ref<HTMLDivElement>
}

export function PaymentQRExportSurface({
  accountName,
  accountNumber,
  bankOrEwallet,
  qrCodeImageUrl = null,
  qrSvg,
  ref
}: PaymentQRExportSurfaceProps) {
  return (
    <div ref={ref} data-ticket-export-root className='overflow-hidden bg-white'>
      <div className='flex min-w-0 flex-col items-center px-6 py-4 text-center sm:px-7 sm:py-7'>
        <div className='my-2 min-w-0 max-w-full'>
          <p className='wrap-break-word font-poly text-xs font-medium uppercase tracking-[0.24em] text-slate-600'>
            {accountName}
          </p>
          <p className='mt-1 wrap-break-word font-ios text-xs uppercase tracking-[0.16em] text-zinc-600'>
            {bankOrEwallet} · {accountNumber}
          </p>
        </div>

        <div
          role='img'
          aria-label={`Payment QR code for ${accountName}`}
          className='my-2 flex aspect-square w-full max-w-72 items-center justify-center overflow-hidden rounded-4xl border-2 border-primary/33 bg-white p-3'>
          {qrSvg ? (
            <div className='size-full [&_svg]:size-full' dangerouslySetInnerHTML={{ __html: qrSvg }} />
          ) : qrCodeImageUrl ? (
            <Image
              src={qrCodeImageUrl}
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
  )
}
