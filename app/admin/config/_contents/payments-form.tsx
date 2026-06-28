'use client'

import { SectionTitle } from '@/components/layouts/title'
import { QRCodeSVG } from '@/components/qrcode/viewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Id } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import Image from 'next/image'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { generatePaymentMethodQrUploadUrl, saveManualPaymentMethod } from '../actions'
import type { ManualPaymentMethod } from './payments'

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

type PaymentsFormProps = {
  paymentMethod: ManualPaymentMethod | null
}

async function decodeQrCodeFile(file: Blob) {
  const BarcodeDetector = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector

  if (!BarcodeDetector) {
    return null
  }

  const image = await createImageBitmap(file)
  const detector = new BarcodeDetector({ formats: ['qr_code'] })

  try {
    const [barcode] = await detector.detect(image)
    return barcode?.rawValue?.trim() || null
  } finally {
    image.close()
  }
}

export function PaymentsForm({ paymentMethod }: PaymentsFormProps) {
  const [bankOrEwallet, setBankOrEwallet] = useState(paymentMethod?.bankOrEwallet ?? '')
  const [accountName, setAccountName] = useState(paymentMethod?.accountName ?? '')
  const [accountNumber, setAccountNumber] = useState(paymentMethod?.accountNumber ?? '')
  const [qrCodeContent, setQrCodeContent] = useState(paymentMethod?.qrCodeContent ?? '')
  const [isActive, setIsActive] = useState(paymentMethod?.isActive ?? false)
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null)
  const [qrCodePreviewUrl, setQrCodePreviewUrl] = useState<string | null>(paymentMethod?.qrCodeImageUrl ?? null)
  const [qrCodeMessage, setQrCodeMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!paymentMethod?.qrCodeImageUrl || paymentMethod.qrCodeContent) {
      return
    }

    const abortController = new AbortController()

    const decodeExistingQrCode = async () => {
      try {
        const response = await fetch(paymentMethod.qrCodeImageUrl as string, {
          signal: abortController.signal
        })

        if (!response.ok) {
          return
        }

        const decodedContent = await decodeQrCodeFile(await response.blob())

        if (!abortController.signal.aborted && decodedContent) {
          setQrCodeContent(decodedContent)
          setQrCodeMessage('QR code content detected from the saved image. Save to store it with this method.')
        }
      } catch {
        // Decoding existing stored QR images is best-effort only.
      }
    }

    void decodeExistingQrCode()

    return () => {
      abortController.abort()
    }
  }, [paymentMethod?.qrCodeContent, paymentMethod?.qrCodeImageUrl])

  const handleQrCodeChange = async (file: File | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setQrCodeFile(file)
    setQrCodeMessage(null)
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!file) {
      setQrCodePreviewUrl(paymentMethod?.qrCodeImageUrl ?? null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextPreviewUrl
    setQrCodePreviewUrl(nextPreviewUrl)

    try {
      const decodedContent = await decodeQrCodeFile(file)

      if (decodedContent) {
        setQrCodeContent(decodedContent)
        setQrCodeMessage('QR code content detected from the uploaded image.')
      } else {
        setQrCodeMessage('QR code content was not detected. Paste it below to generate the payment QR.')
      }
    } catch {
      setQrCodeMessage('QR code content was not detected. Paste it below to generate the payment QR.')
    }
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      let qrCodeStorageId: Id<'_storage'> | undefined

      if (qrCodeFile) {
        const uploadUrl = await generatePaymentMethodQrUploadUrl()
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': qrCodeFile.type || 'application/octet-stream'
          },
          body: qrCodeFile
        })

        if (!uploadResponse.ok) {
          throw new Error('Unable to upload this QR code image.')
        }

        const uploadResult = (await uploadResponse.json()) as { storageId: Id<'_storage'> }
        qrCodeStorageId = uploadResult.storageId
      }

      await saveManualPaymentMethod({
        id: paymentMethod?._id,
        bankOrEwallet,
        accountName,
        accountNumber,
        qrCodeStorageId,
        qrCodeContent,
        isActive
      })

      setQrCodeFile(null)
      setSuccessMessage('Manual payment method saved.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save payment method.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'>
      <section className='rounded-lg border border-border/70 bg-card p-4 sm:p-5'>
        <div className='flex items-start justify-between gap-4'>
          <SectionTitle title='Payment Destination' eyebrow='Manual Payments' />
          <div className='rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground'>
            {isActive ? 'Active' : paymentMethod ? 'Inactive' : 'Draft'}
          </div>
        </div>

        <div className='mt-5 grid gap-3 text-sm'>
          <PaymentDetail label='Bank / EWallet' value={bankOrEwallet || 'N/A'} />
          <PaymentDetail label='Account name' value={accountName || 'N/A'} />
          <PaymentDetail label='Account number' value={accountNumber || 'N/A'} />
        </div>

        <div className='flex min-h-80 items-center justify-center overflow-hidden bg-background'>
          {qrCodeContent ? (
            <QRCodeSVG
              className='rounded-lg bg-white [&_svg]:size-64'
              options={{
                content: qrCodeContent,
                width: 280,
                height: 280
              }}
            />
          ) : qrCodePreviewUrl ? (
            <Image
              src={qrCodePreviewUrl}
              alt='Manual payment QR code'
              width={360}
              height={360}
              unoptimized
              className='size-full max-h-72 object-contain p-4'
            />
          ) : (
            <div className='flex flex-col items-center gap-3 p-6 text-center text-muted-foreground'>
              <Icon name='file' className='size-8' />
              <p className='text-sm'>No QR code uploaded.</p>
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit} className='rounded-lg border border-border/70 bg-card p-4 sm:p-5'>
        <div className='grid gap-4'>
          <SectionTitle title='Edit Method' eyebrow='Manual Payments' />
          <div className='flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-3'>
            <div>
              <Label htmlFor='payment-active'>Active destination</Label>
              <p className='mt-1 text-xs text-muted-foreground'>Use this payment destination on entry forms.</p>
            </div>
            <Switch id='payment-active' checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='payment-bank-ewallet'>Bank name or EWallet</Label>
            <Input
              id='payment-bank-ewallet'
              value={bankOrEwallet}
              onChange={(event) => setBankOrEwallet(event.currentTarget.value)}
              placeholder='GCash, Maya, BDO, BPI'
              className='h-11'
              required
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='payment-account-name'>Account name</Label>
            <Input
              id='payment-account-name'
              value={accountName}
              onChange={(event) => setAccountName(event.currentTarget.value)}
              placeholder='Account holder name'
              className='h-11'
              required
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='payment-account-number'>Account number</Label>
            <Input
              id='payment-account-number'
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.currentTarget.value)}
              placeholder='Mobile number or bank account number'
              className='h-11'
              required
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='payment-qr-code'>QR code image</Label>
            <Input
              id='payment-qr-code'
              type='file'
              accept='image/png,image/jpeg,image/webp,image/avif,image/gif'
              onChange={(event) => {
                void handleQrCodeChange(event.currentTarget.files?.[0] ?? null)
              }}
              className='h-11 file:mr-3'
            />
            {qrCodeMessage ? <p className='text-xs text-muted-foreground'>{qrCodeMessage}</p> : null}
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='payment-qr-content'>QR code content</Label>
            <textarea
              id='payment-qr-content'
              value={qrCodeContent}
              onChange={(event) => setQrCodeContent(event.currentTarget.value)}
              placeholder='Paste the decoded QR payload if it was not detected automatically'
              className='min-h-24 w-full resize-y rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
            />
          </div>

          {errorMessage ? (
            <p role='alert' className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p role='status' className='rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'>
              {successMessage}
            </p>
          ) : null}

          <Button type='submit' className='h-11 justify-center' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Icon name='spinner-ring' className='size-4' />
                <span>Saving</span>
              </>
            ) : (
              <>
                <Icon name='check' className='size-4' />
                <span>Save payment method</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function PaymentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg border border-border/60 bg-muted/20 px-3 py-2'>
      <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{label}</p>
      <p className='mt-1 wrap-break-word font-medium text-foreground/85'>{value}</p>
    </div>
  )
}
