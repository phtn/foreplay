'use client'

import { SectionTitle } from '@/components/layouts/title'
import { QRCodeSVG } from '@/components/qrcode/viewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Id } from '@/convex/_generated/dataModel'
import { useImageConverter } from '@/hooks/use-image-converter'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { generatePaymentMethodQrUploadUrl, saveManualPaymentMethod } from '../actions'
import type { ManualPaymentMethod } from './payments'

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

type PaymentsFormProps = {
  paymentMethods: ManualPaymentMethod[]
}

type PaymentFormValues = {
  bankOrEwallet: string
  accountName: string
  accountNumber: string
  qrCodeContent: string
  isActive: boolean
}

const emptyFormValues: PaymentFormValues = {
  bankOrEwallet: '',
  accountName: '',
  accountNumber: '',
  qrCodeContent: '',
  isActive: false
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

function getInitialPaymentMethod(paymentMethods: ManualPaymentMethod[]) {
  return paymentMethods.find((paymentMethod) => paymentMethod.isActive) ?? paymentMethods[0] ?? null
}

function getPaymentFormValues(paymentMethod: ManualPaymentMethod | null): PaymentFormValues {
  if (!paymentMethod) {
    return emptyFormValues
  }

  return {
    bankOrEwallet: paymentMethod.bankOrEwallet,
    accountName: paymentMethod.accountName,
    accountNumber: paymentMethod.accountNumber,
    qrCodeContent: paymentMethod.qrCodeContent ?? '',
    isActive: paymentMethod.isActive === true
  }
}

function formatCardNumber(value: string) {
  const compactValue = value.replace(/\s+/g, '')

  if (!compactValue) {
    return '0000 0000 0000 0000'
  }

  return compactValue.replace(/(.{4})/g, '$1 ').trim()
}

function formatUpdatedAt(value: number | undefined) {
  return value ? new Date(value).toLocaleString() : 'Not saved'
}

export function PaymentsForm({ paymentMethods }: PaymentsFormProps) {
  const router = useRouter()
  const initialPaymentMethod = getInitialPaymentMethod(paymentMethods)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<Id<'paymentMethods'> | null>(
    initialPaymentMethod?._id ?? null
  )
  const [isCreating, setIsCreating] = useState(paymentMethods.length === 0)
  const [isEditing, setIsEditing] = useState(paymentMethods.length === 0)
  const [formValues, setFormValues] = useState<PaymentFormValues>(() => getPaymentFormValues(initialPaymentMethod))
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null)
  const [qrCodePreviewUrl, setQrCodePreviewUrl] = useState<string | null>(initialPaymentMethod?.qrCodeImageUrl ?? null)
  const [qrCodeMessage, setQrCodeMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const objectUrlRef = useRef<string | null>(null)
  const { convert, terminate } = useImageConverter()

  const selectedPaymentMethod = isCreating
    ? null
    : (paymentMethods.find((paymentMethod) => paymentMethod._id === selectedPaymentMethodId) ?? initialPaymentMethod)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }

      terminate()
    }
  }, [terminate])

  useEffect(() => {
    if (!selectedPaymentMethod?.qrCodeImageUrl || selectedPaymentMethod.qrCodeContent || formValues.qrCodeContent) {
      return
    }

    const abortController = new AbortController()

    const decodeExistingQrCode = async () => {
      try {
        const response = await fetch(selectedPaymentMethod.qrCodeImageUrl as string, {
          signal: abortController.signal
        })

        if (!response.ok) {
          return
        }

        const decodedContent = await decodeQrCodeFile(await response.blob())

        if (!abortController.signal.aborted && decodedContent) {
          setFormValues((current) => ({ ...current, qrCodeContent: decodedContent }))
          setQrCodeMessage('QR code content detected from the saved image. Save to store it with this destination.')
        }
      } catch {
        // Decoding existing stored QR images is best-effort only.
      }
    }

    void decodeExistingQrCode()

    return () => {
      abortController.abort()
    }
  }, [formValues.qrCodeContent, selectedPaymentMethod?.qrCodeContent, selectedPaymentMethod?.qrCodeImageUrl])

  const revokePreviewUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const loadPaymentMethod = (paymentMethod: ManualPaymentMethod, edit = false) => {
    revokePreviewUrl()
    setSelectedPaymentMethodId(paymentMethod._id)
    setIsCreating(false)
    setIsEditing(edit)
    setFormValues(getPaymentFormValues(paymentMethod))
    setQrCodeFile(null)
    setQrCodePreviewUrl(paymentMethod.qrCodeImageUrl)
    setQrCodeMessage(null)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const startCreate = () => {
    revokePreviewUrl()
    setSelectedPaymentMethodId(null)
    setIsCreating(true)
    setIsEditing(true)
    setFormValues(emptyFormValues)
    setQrCodeFile(null)
    setQrCodePreviewUrl(null)
    setQrCodeMessage(null)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const updateFormValue = <Key extends keyof PaymentFormValues>(key: Key, value: PaymentFormValues[Key]) => {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  const handleQrCodeChange = async (file: File | null) => {
    revokePreviewUrl()

    setQrCodeFile(file)
    setQrCodeMessage(null)
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!file) {
      setQrCodePreviewUrl(selectedPaymentMethod?.qrCodeImageUrl ?? null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextPreviewUrl
    setQrCodePreviewUrl(nextPreviewUrl)

    try {
      const decodedContent = await decodeQrCodeFile(file)

      if (decodedContent) {
        updateFormValue('qrCodeContent', decodedContent)
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
        const convertedQrCode = await convert(qrCodeFile, { format: 'webp', quality: 0.92 })
        const uploadUrl = await generatePaymentMethodQrUploadUrl()
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': convertedQrCode.format || 'image/webp'
          },
          body: convertedQrCode.blob
        })

        if (!uploadResponse.ok) {
          throw new Error('Unable to upload this QR code image.')
        }

        const uploadResult = (await uploadResponse.json()) as { storageId: Id<'_storage'> }
        qrCodeStorageId = uploadResult.storageId
      }

      const result = await saveManualPaymentMethod({
        id: isCreating ? undefined : selectedPaymentMethod?._id,
        bankOrEwallet: formValues.bankOrEwallet,
        accountName: formValues.accountName,
        accountNumber: formValues.accountNumber,
        qrCodeStorageId,
        qrCodeContent: formValues.qrCodeContent,
        isActive: formValues.isActive
      })

      setSelectedPaymentMethodId(result.paymentMethodId)
      setIsCreating(false)
      setIsEditing(false)
      setQrCodeFile(null)
      revokePreviewUrl()
      setQrCodePreviewUrl(null)
      setSuccessMessage('Payment destination saved.')
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save payment destination.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='space-y-5 px-2'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-2'>
        <SectionTitle title='Destination' eyebrow='Manual Payments' />
      </div>

      <div className='space-y-4'>
        <section className='grid gap-4 md:grid-cols-2 w-full'>
          {paymentMethods.length ? (
            paymentMethods.map((paymentMethod) => (
              <PaymentDestinationCard
                key={paymentMethod._id}
                paymentMethod={paymentMethod}
                selected={paymentMethod._id === selectedPaymentMethod?._id && !isCreating}
                onView={() => loadPaymentMethod(paymentMethod)}
                onEdit={() => loadPaymentMethod(paymentMethod, true)}
              />
            ))
          ) : (
            <div className='flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/10 p-8 text-center md:col-span-2'>
              <Icon name='file' className='size-9 text-muted-foreground/70' />
              <div>
                <p className='font-okx text-base'>No payment destinations</p>
                <p className='mt-1 text-sm text-muted-foreground'>Create the first manual payment account.</p>
              </div>
              <Button type='button' variant='outline' onClick={startCreate}>
                <Icon name='add' className='size-4' />
                <span>Add destination</span>
              </Button>
            </div>
          )}
        </section>

        <aside className=' rounded-lg border border-border/70 bg-card p-4 sm:p-5'>
          <div className='space-y-4'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='font-ios text-xs uppercase tracking-widest text-sky-600'>
                  {isCreating ? 'New destination' : 'Selected destination'}
                </p>
                <h3 className='mt-1 font-okx text-lg font-semibold'>
                  {isCreating
                    ? 'Add payment account'
                    : (selectedPaymentMethod?.bankOrEwallet ?? 'No destination selected')}
                </h3>
              </div>
              {(selectedPaymentMethod || isCreating) && !isCreating ? (
                <div className='flex items-center gap-2'>
                  <Label htmlFor='payment-edit-toggle' className='text-xs text-muted-foreground'>
                    Edit
                  </Label>
                  <Switch id='payment-edit-toggle' checked={isEditing} onCheckedChange={setIsEditing} />
                </div>
              ) : null}
            </div>

            {successMessage && !isEditing ? (
              <p role='status' className='rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'>
                {successMessage}
              </p>
            ) : null}

            {!isEditing && selectedPaymentMethod ? (
              <PaymentDestinationSummary paymentMethod={selectedPaymentMethod} />
            ) : null}

            {isEditing ? (
              <form onSubmit={handleSubmit} className='grid gap-4'>
                <div className='flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-3'>
                  <div>
                    <Label htmlFor='payment-active'>Active destination</Label>
                    <p className='mt-1 text-xs text-muted-foreground'>Only one destination can be active at a time.</p>
                  </div>
                  <Switch
                    id='payment-active'
                    checked={formValues.isActive}
                    onCheckedChange={(value) => updateFormValue('isActive', value)}
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='payment-bank-ewallet'>Bank name or EWallet</Label>
                  <Input
                    id='payment-bank-ewallet'
                    value={formValues.bankOrEwallet}
                    onChange={(event) => updateFormValue('bankOrEwallet', event.currentTarget.value)}
                    placeholder='GCash, Maya, BDO, BPI'
                    className='h-11'
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='payment-account-name'>Account name</Label>
                  <Input
                    id='payment-account-name'
                    value={formValues.accountName}
                    onChange={(event) => updateFormValue('accountName', event.currentTarget.value)}
                    placeholder='Account holder name'
                    className='h-11'
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='payment-account-number'>Account number</Label>
                  <Input
                    id='payment-account-number'
                    value={formValues.accountNumber}
                    onChange={(event) => updateFormValue('accountNumber', event.currentTarget.value)}
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

                <QrPreview qrCodeContent={formValues.qrCodeContent} qrCodePreviewUrl={qrCodePreviewUrl} />

                <div className='grid gap-2'>
                  <Label htmlFor='payment-qr-content'>QR code content</Label>
                  <textarea
                    id='payment-qr-content'
                    value={formValues.qrCodeContent}
                    onChange={(event) => updateFormValue('qrCodeContent', event.currentTarget.value)}
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

                <div className='grid gap-2 sm:grid-cols-2'>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-11 justify-center'
                    disabled={isSubmitting}
                    onClick={() => {
                      if (isCreating) {
                        const nextPaymentMethod = getInitialPaymentMethod(paymentMethods)
                        if (nextPaymentMethod) {
                          loadPaymentMethod(nextPaymentMethod)
                        } else {
                          setIsCreating(false)
                          setIsEditing(false)
                        }
                      } else if (selectedPaymentMethod) {
                        loadPaymentMethod(selectedPaymentMethod)
                      }
                    }}>
                    Cancel
                  </Button>
                  <Button type='submit' className='h-11 justify-center' disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Icon name='spinner-ring' className='size-4' />
                        <span>Saving</span>
                      </>
                    ) : (
                      <>
                        <Icon name='check' className='size-4' />
                        <span>Save</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : null}

            {!isEditing && !selectedPaymentMethod ? (
              <div className='rounded-lg border border-dashed border-border/70 bg-muted/10 p-6 text-center'>
                <p className='font-okx text-sm'>Select a destination or add a new one.</p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
      <Button type='button' className='h-10 justify-center' onClick={startCreate}>
        <Icon name='add' className='size-4' />
        <span>Add destination</span>
      </Button>
    </div>
  )
}

function PaymentDestinationCard({
  onEdit,
  onView,
  paymentMethod,
  selected
}: {
  onEdit: () => void
  onView: () => void
  paymentMethod: ManualPaymentMethod
  selected: boolean
}) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border bg-card shadow-sm transition-colors h-fit',
        selected ? 'border-sky-500/70 ring-2 ring-sky-500/15' : 'border-border/70'
      )}>
      <div className='relative aspect-[1.58] overflow-hidden bg-[linear-gradient(135deg,#0f172a,#1f2937_48%,#0e7490)] p-5 text-white'>
        <div className='absolute inset-x-0 top-0 h-16 bg-white/8' />
        <div className='absolute -right-10 bottom-8 h-28 w-48 rotate-[-22deg] bg-white/10' />
        <div className='relative flex h-full flex-col justify-between'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='font-ios text-[10px] uppercase tracking-widest text-white/65'>Manual payment</p>
              <h3 className='mt-1 truncate font-okx text-lg font-semibold'>{paymentMethod.bankOrEwallet}</h3>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 font-ios text-[10px] uppercase tracking-widest',
                paymentMethod.isActive ? 'bg-emerald-400 text-emerald-950' : 'bg-white/12 text-white/70'
              )}>
              {paymentMethod.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className='grid gap-4'>
            <div className='h-8 w-11 rounded-md border border-white/25 bg-[linear-gradient(135deg,#f7e7a1,#b88920)] shadow-inner' />
            <p className='font-mono text-base tracking-[0.18em]'>{formatCardNumber(paymentMethod.accountNumber)}</p>
            <div className='flex items-end justify-between gap-4'>
              <div className='min-w-0'>
                <p className='font-ios text-[10px] uppercase tracking-widest text-white/55'>Account name</p>
                <p className='mt-1 truncate font-okx text-sm'>{paymentMethod.accountName}</p>
              </div>
              <div className='text-right'>
                <p className='font-ios text-[10px] uppercase tracking-widest text-white/55'>Updated</p>
                <p className='mt-1 whitespace-nowrap font-okx text-xs'>{formatUpdatedAt(paymentMethod.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between gap-2 p-3'>
        <button
          type='button'
          className='text-sm text-muted-foreground transition-colors hover:text-foreground'
          onClick={onView}>
          View details
        </button>
        <Button type='button' variant='outline' size='sm' onClick={onEdit}>
          Edit
        </Button>
      </div>
    </article>
  )
}

function PaymentDestinationSummary({ paymentMethod }: { paymentMethod: ManualPaymentMethod }) {
  return (
    <div className='grid gap-4'>
      <QrPreview qrCodeContent={paymentMethod.qrCodeContent ?? ''} qrCodePreviewUrl={paymentMethod.qrCodeImageUrl} />

      <div className='grid gap-3 text-sm'>
        <PaymentDetail label='Bank / EWallet' value={paymentMethod.bankOrEwallet} />
        <PaymentDetail label='Account name' value={paymentMethod.accountName} />
        <PaymentDetail label='Account number' value={paymentMethod.accountNumber} />
        <PaymentDetail label='Status' value={paymentMethod.isActive ? 'Active on entry forms' : 'Inactive'} />
      </div>
    </div>
  )
}

function QrPreview({ qrCodeContent, qrCodePreviewUrl }: { qrCodeContent: string; qrCodePreviewUrl: string | null }) {
  return (
    <div className='flex min-h-56 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-background'>
      {qrCodeContent ? (
        <QRCodeSVG
          className='rounded-lg bg-white [&_svg]:size-52'
          options={{
            content: qrCodeContent,
            width: 220,
            height: 220
          }}
        />
      ) : qrCodePreviewUrl ? (
        <Image
          src={qrCodePreviewUrl}
          alt='Manual payment QR code'
          width={320}
          height={320}
          unoptimized
          className='size-full max-h-56 object-contain p-4'
        />
      ) : (
        <div className='flex flex-col items-center gap-3 p-6 text-center text-muted-foreground'>
          <Icon name='file' className='size-8' />
          <p className='text-sm'>No QR code uploaded.</p>
        </div>
      )}
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
