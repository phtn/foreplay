'use client'

import { useAppForm } from '@/components/form'
import { createPaymentQRCodeSvg, PaymentQRExportSurface } from '@/components/qrcode/payment-export-surface'
import { QRCodeSVG } from '@/components/qrcode/viewer'
import { Button } from '@/components/ui/button'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { isSubscriptionEntryLocked } from '@/convex/subscriptions/policy'
import { useImageConverter } from '@/hooks/use-image-converter'
import { Icon } from '@/lib/icons'
import { createPngFilename, downloadElementAsPng } from '@/lib/tickets/download-ticket-png'
import { cn } from '@/lib/utils'
import { revalidateLogic } from '@tanstack/react-form'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Activity, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createTournamentSubscription,
  generateReceiptUploadUrl,
  submitAdminOverrideReceipt,
  updateTournamentSubscriptionReceipt
} from './actions'
import { type EntryPricingOption, validateEntryFormValues } from './entry-logic'

const entryControlClassName =
  'h-12 border-border/40 bg-input/40 py-1 pe-3 font-ios text-base text-foreground/80 shadow-none hover:bg-input/40 focus-visible:bg-input/30 sm:text-sm dark:border-white/20 dark:bg-input/20 dark:hover:bg-input/20 dark:focus-visible:bg-input/20'

const mobileViewportQuery = '(max-width: 767px)'
const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const receiptHintId = 'payment-receipt-hint'
const receiptErrorId = 'payment-receipt-error'
const paymentToolsErrorId = 'payment-tools-error'

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
  style: 'currency'
})

type Subscription = Doc<'subscriptions'>

type PaymentMethod = {
  bankOrEwallet: string
  accountName: string
  accountNumber: string
  qrCodeContent: string | null
}

const formatPaymentDetails = (paymentMethod: PaymentMethod, amount: number, reference: string) =>
  [
    `Payment Service: ${paymentMethod.bankOrEwallet}`,
    `Account Name: ${paymentMethod.accountName}`,
    `Account Number: ${paymentMethod.accountNumber}`,
    `Amount: ${currencyFormatter.format(amount)}`,
    `Reference: ${reference}`
  ].join('\n')

interface NewEntryFormProps {
  tourId: string
  formId: string
  players: number
  totalAmount: number
  division: string
  initialFullName: string
  initialEmail: string
  initialPhone: string
  isAdmin: boolean
  initialSubscription: Subscription | null
  paymentMethod: PaymentMethod | null
  divisionOptions: EntryPricingOption[]
  divisionLabel: string
  onPlayersChange: (nextPlayers: number) => void
  onDivisionChange: (nextDivision: string) => void
}

export const NewEntryForm = ({
  tourId,
  formId,
  players,
  totalAmount,
  division,
  initialFullName,
  initialEmail,
  initialPhone,
  isAdmin,
  initialSubscription,
  paymentMethod,
  divisionOptions,
  divisionLabel,
  onPlayersChange,
  onDivisionChange
}: NewEntryFormProps) => {
  const initiallyLocked = isSubscriptionEntryLocked(initialSubscription)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(() =>
    initialSubscription && !initiallyLocked
      ? 'Entry saved. You can make changes until you submit your receipt.'
      : null
  )
  const [subscriptionId, setSubscriptionId] = useState<Id<'subscriptions'> | null>(initialSubscription?._id ?? null)
  const [didSubmitReceipt, setDidSubmitReceipt] = useState(false)
  const isEntryLocked = initiallyLocked || didSubmitReceipt
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)
  const receiptPreviewUrlRef = useRef<string | null>(null)
  const formElementRef = useRef<HTMLFormElement | null>(null)
  const paymentSectionRef = useRef<HTMLElement | null>(null)
  const paymentQrExportRef = useRef<HTMLDivElement | null>(null)
  const paymentQrExportLockRef = useRef(false)
  const receiptInputRef = useRef<HTMLInputElement | null>(null)
  const copiedStatusTimeoutRef = useRef<number | null>(null)
  const [receiptErrorMessage, setReceiptErrorMessage] = useState<string | null>(null)
  const [receiptSuccessMessage, setReceiptSuccessMessage] = useState<string | null>(() =>
    initiallyLocked
      ? initialSubscription?.status === 'cancelled'
        ? 'This entry is cancelled and can no longer be changed.'
        : 'Receipt uploaded. Payment is pending review.'
      : null
  )
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false)
  const [isDownloadingQr, setIsDownloadingQr] = useState(false)
  const [paymentDetailsCopied, setPaymentDetailsCopied] = useState(false)
  const [paymentToolsErrorMessage, setPaymentToolsErrorMessage] = useState<string | null>(null)
  const { convert, terminate } = useImageConverter()
  const [entryQuery, setEntryQuery] = useQueryStates(
    {
      formId: parseAsString,
      teamName: parseAsString,
      email: parseAsString,
      phone: parseAsString,
      players: parseAsInteger,
      division: parseAsString,
      handicapIndex: parseAsString
    },
    { history: 'replace', shallow: true }
  )

  useEffect(() => {
    if (!formId || entryQuery.formId === formId) {
      return
    }

    void setEntryQuery({ formId })
  }, [entryQuery.formId, formId, setEntryQuery])

  useEffect(() => {
    return () => {
      if (receiptPreviewUrlRef.current) {
        URL.revokeObjectURL(receiptPreviewUrlRef.current)
      }

      if (copiedStatusTimeoutRef.current !== null) {
        window.clearTimeout(copiedStatusTimeoutRef.current)
      }

      terminate()
    }
  }, [terminate])

  const scrollToPaymentSectionOnMobile = useCallback(() => {
    if (!window.matchMedia(mobileViewportQuery).matches) {
      return
    }

    window.requestAnimationFrame(() => {
      paymentSectionRef.current?.scrollIntoView({
        behavior: window.matchMedia(reducedMotionQuery).matches ? 'auto' : 'smooth',
        block: 'start'
      })
    })
  }, [])

  const form = useAppForm({
    validationLogic: revalidateLogic({ mode: 'submit', modeAfterSubmission: 'change' }),
    defaultValues: {
      fullName: initiallyLocked
        ? (initialSubscription?.team_name ?? initialFullName)
        : (entryQuery.teamName ?? initialSubscription?.team_name ?? initialFullName),
      email: initiallyLocked
        ? (initialSubscription?.contact_email ?? initialEmail)
        : (entryQuery.email ?? initialSubscription?.contact_email ?? initialEmail),
      phone: initiallyLocked
        ? (initialSubscription?.contact_phone ?? initialPhone)
        : (entryQuery.phone ?? initialSubscription?.contact_phone ?? initialPhone),
      division: initiallyLocked
        ? (initialSubscription?.division ?? division)
        : (entryQuery.division ?? initialSubscription?.division ?? division),
      playerCount: String(
        initiallyLocked
          ? (initialSubscription?.total_players ?? players)
          : (entryQuery.players ?? initialSubscription?.total_players ?? players)
      ),
      handicapIndex: initiallyLocked
        ? (initialSubscription?.handicap_index ?? '')
        : (entryQuery.handicapIndex ?? initialSubscription?.handicap_index ?? '')
    },
    validators: {
      onDynamic: ({ value }) => validateEntryFormValues(value)
    },
    onSubmitInvalid: () => {
      window.requestAnimationFrame(() => {
        formElementRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      })
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)
      setSuccessMessage(null)
      const wasSaved = subscriptionId !== null

      try {
        const result = await createTournamentSubscription({
          tourId,
          formId,
          teamName: value.fullName,
          email: value.email,
          phone: value.phone,
          playerCount: value.playerCount,
          paymentAmount: totalAmount,
          handicapIndex: value.handicapIndex,
          division: value.division
        })

        if (!result.ok) {
          setErrorMessage(result.error)
          return
        }

        setSubscriptionId(result.value.subscriptionId)
        setSuccessMessage(
          wasSaved
            ? 'Changes saved. You can keep editing until you submit your receipt.'
            : 'Entry saved. You can make changes until you submit your receipt.'
        )
        scrollToPaymentSectionOnMobile()
      } catch {
        setErrorMessage('Unable to save this entry request.')
      }
    }
  })
  const isSubmitting = form.state.isSubmitting
  const isSaved = subscriptionId !== null
  const isDraftBusy = isSubmitting || isSubmittingReceipt
  const paymentQRCodeContent = paymentMethod?.qrCodeContent ?? null
  const paymentDownloadQrSvg = useMemo(() => createPaymentQRCodeSvg(paymentQRCodeContent), [paymentQRCodeContent])
  const paymentDetails = paymentMethod ? formatPaymentDetails(paymentMethod, totalAmount, formId) : null
  const hasPaymentDestination = Boolean(paymentMethod)
  const copyPaymentDetails = useCallback(async () => {
    setPaymentToolsErrorMessage(null)

    if (!navigator.clipboard) {
      setPaymentToolsErrorMessage('Copying is unavailable in this browser. Select the payment details instead.')
      return
    }

    if (!paymentDetails) {
      setPaymentToolsErrorMessage('Payment details are unavailable. Contact the tournament organizer.')
      return
    }

    try {
      await navigator.clipboard.writeText(paymentDetails)
      setPaymentDetailsCopied(true)

      if (copiedStatusTimeoutRef.current !== null) {
        window.clearTimeout(copiedStatusTimeoutRef.current)
      }

      copiedStatusTimeoutRef.current = window.setTimeout(() => {
        setPaymentDetailsCopied(false)
        copiedStatusTimeoutRef.current = null
      }, 1600)
    } catch {
      setPaymentToolsErrorMessage('Unable to copy the payment details. Select them and copy manually.')
    }
  }, [paymentDetails])
  const downloadPaymentQR = useCallback(async () => {
    if (!paymentMethod || !paymentDownloadQrSvg || !paymentQrExportRef.current || paymentQrExportLockRef.current) {
      return
    }

    paymentQrExportLockRef.current = true
    setPaymentToolsErrorMessage(null)
    setIsDownloadingQr(true)

    try {
      await downloadElementAsPng(
        paymentQrExportRef.current,
        createPngFilename(
          `foreplay-payment-${paymentMethod.bankOrEwallet}-${paymentMethod.accountName}`,
          `${formId}-payment-qr`
        )
      )
    } catch (error) {
      console.error('Unable to export the payment QR code.', error)
      setPaymentToolsErrorMessage('Unable to download the payment QR code. Try again.')
    } finally {
      paymentQrExportLockRef.current = false
      setIsDownloadingQr(false)
    }
  }, [formId, paymentDownloadQrSvg, paymentMethod])
  const submitReceipt = useCallback(async () => {
    if (!subscriptionId || isEntryLocked) {
      return
    }

    setReceiptErrorMessage(null)
    setReceiptSuccessMessage(null)

    if (!isAdmin && !hasPaymentDestination) {
      setReceiptErrorMessage('Payment details are unavailable. Contact the tournament organizer.')
      return
    }

    if (!receiptFile && !isAdmin) {
      setReceiptErrorMessage('Choose a receipt file before submitting.')
      window.requestAnimationFrame(() => receiptInputRef.current?.focus())
      return
    }

    setIsSubmittingReceipt(true)

    try {
      if (!receiptFile) {
        const overrideResult = await submitAdminOverrideReceipt({ subscriptionId, formId })

        if (!overrideResult.ok) {
          throw new Error(overrideResult.error)
        }

        setDidSubmitReceipt(true)
        setSuccessMessage(null)
        setReceiptSuccessMessage('Submitted without a receipt. Payment is pending review.')
        return
      }

      const convertedReceipt = receiptFile.type.startsWith('image/')
        ? await convert(receiptFile, {
            format: 'webp',
            quality: 0.82
          })
        : null
      const uploadBlob = convertedReceipt?.blob ?? receiptFile
      const uploadContentType = convertedReceipt?.format || receiptFile.type || 'application/octet-stream'
      const uploadUrlResult = await generateReceiptUploadUrl({ subscriptionId, formId })

      if (!uploadUrlResult.ok) {
        throw new Error(uploadUrlResult.error)
      }

      const uploadResponse = await fetch(uploadUrlResult.value, {
        method: 'POST',
        headers: {
          'Content-Type': uploadContentType
        },
        body: uploadBlob
      })

      if (!uploadResponse.ok) {
        throw new Error('Unable to upload this receipt file.')
      }

      const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> }

      const updateResult = await updateTournamentSubscriptionReceipt({
        subscriptionId,
        formId,
        storageId
      })

      if (!updateResult.ok) {
        throw new Error(updateResult.error)
      }

      setDidSubmitReceipt(true)
      setSuccessMessage(null)
      setReceiptSuccessMessage('Receipt uploaded. Payment is pending review.')
    } catch (error) {
      setReceiptErrorMessage(error instanceof Error ? error.message : 'Unable to submit this receipt.')
    } finally {
      setIsSubmittingReceipt(false)
    }
  }, [convert, formId, hasPaymentDestination, isAdmin, isEntryLocked, receiptFile, subscriptionId])

  const router = useRouter()
  const canChooseReceipt = !isEntryLocked && !isDraftBusy && (isAdmin || hasPaymentDestination)
  const receiptActionUnavailable = !isEntryLocked && !isAdmin && !hasPaymentDestination

  return (
    <form.AppForm>
      <form
        ref={formElementRef}
        aria-busy={isDraftBusy}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}>
        <div className='grid lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]'>
          <div className='grid gap-8 p-4 sm:grid-cols-2 md:p-8'>
            <p className='text-xs text-muted-foreground sm:col-span-2'>
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>{' '}
              Required field
            </p>

            <fieldset className='space-y-4'>
              <legend className='mb-4 font-poly text-base font-medium text-foreground'>Entry details</legend>
              <form.AppField name='fullName'>
                {({ TextField }) => (
                  <TextField
                    id='entry-name'
                    type='text'
                    label='Player or team name'
                    icon='user'
                    placeholder='Juan dela Cruz or Fairway Four'
                    autoComplete='name'
                    containerClassName='mb-0'
                    className={entryControlClassName}
                    disabled={isDraftBusy || isEntryLocked}
                    onChange={(event) => {
                      void setEntryQuery({ teamName: event.currentTarget.value || null })
                    }}
                  />
                )}
              </form.AppField>

              <form.AppField name='playerCount'>
                {({ TextField }) => (
                  <TextField
                    id='entry-players'
                    label='Number of players'
                    type='number'
                    icon='person-multiple'
                    min='1'
                    max='20'
                    inputMode='numeric'
                    required
                    containerClassName='mb-0'
                    className={entryControlClassName}
                    disabled={isDraftBusy || isEntryLocked}
                    onChange={(event) => {
                      const nextPlayers = Number(event.currentTarget.value)
                      if (Number.isInteger(nextPlayers) && nextPlayers >= 1 && nextPlayers <= 20) {
                        onPlayersChange(nextPlayers)
                      }
                    }}
                  />
                )}
              </form.AppField>

              <form.AppField name='division'>
                {({ SelectField }) => (
                  <SelectField
                    id='entry-division'
                    label={divisionLabel}
                    options={divisionOptions}
                    required
                    containerClassName='mb-0'
                    className={entryControlClassName}
                    disabled={isDraftBusy || isEntryLocked}
                    onChange={(event) => {
                      onDivisionChange(event.currentTarget.value)
                    }}
                  />
                )}
              </form.AppField>

              <form.AppField name='handicapIndex'>
                {({ TextField }) => (
                  <TextField
                    id='entry-handicap'
                    type='text'
                    inputMode='decimal'
                    label='Handicap index (optional)'
                    icon='golf-tee'
                    placeholder='e.g. 12.4'
                    containerClassName='mb-0'
                    className={entryControlClassName}
                    disabled={isDraftBusy || isEntryLocked}
                    onChange={(event) => {
                      void setEntryQuery({ handicapIndex: event.currentTarget.value || null })
                    }}
                  />
                )}
              </form.AppField>
            </fieldset>

            <fieldset className='space-y-4'>
              <legend className='mb-4 font-poly text-base font-medium text-foreground'>Contact details</legend>
              <form.AppField name='email'>
                {({ TextField }) => (
                  <TextField
                    id='entry-email'
                    label='Email'
                    icon='mail'
                    type='email'
                    placeholder='name@example.com'
                    autoComplete='email'
                    spellCheck={false}
                    required
                    containerClassName='mb-0'
                    className={entryControlClassName}
                    disabled={isDraftBusy || isEntryLocked}
                    onChange={(event) => {
                      void setEntryQuery({ email: event.currentTarget.value || null })
                    }}
                  />
                )}
              </form.AppField>

              <form.AppField name='phone'>
                {({ TextField }) => (
                  <TextField
                    id='entry-phone'
                    type='tel'
                    label='Phone'
                    icon='phone-accept'
                    placeholder='+63 917 123 4567'
                    autoComplete='tel'
                    required
                    containerClassName='mb-0'
                    className={entryControlClassName}
                    disabled={isDraftBusy || isEntryLocked}
                    onChange={(event) => {
                      void setEntryQuery({ phone: event.currentTarget.value || null })
                    }}
                  />
                )}
              </form.AppField>
            </fieldset>
          </div>

          <section
            aria-labelledby='entry-submit-title'
            className='flex min-h-64 flex-col justify-center gap-5 bg-muted/25 p-6 text-center md:p-8'>
            <div className='space-y-2'>
              <h2 id='entry-submit-title' className='font-poly text-lg font-medium text-foreground'>
                {isSaved ? 'Review your entry' : 'Submit your entry'}
              </h2>
              <p id='entry-submit-help' className='text-pretty text-sm leading-normal text-muted-foreground'>
                {isSaved
                  ? 'You can edit these details until you submit your receipt.'
                  : `Submit your entry request for ${tourId}. Your spot is confirmed after payment review.`}
              </p>
            </div>

            {errorMessage ? (
              <p role='alert' className='rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                {errorMessage}
              </p>
            ) : null}

            <div
              role='status'
              aria-live='polite'
              aria-atomic='true'
              className={cn(
                successMessage
                  ? 'flex items-start justify-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm leading-normal text-success-foreground'
                  : 'sr-only'
              )}>
              {successMessage ? (
                <>
                  <Icon name='check' className='mt-0.5 size-4 shrink-0' />
                  <span className='text-pretty'>{successMessage}</span>
                </>
              ) : null}
            </div>

            {isEntryLocked ? (
              <div className='flex min-h-12 items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground'>
                <Icon name='check' className='size-4' />
                <span>Entry details locked</span>
              </div>
            ) : (
              <Button
                size='xl'
                type='submit'
                id='entry-info-submit'
                variant={isSaved ? 'outline' : 'default'}
                className='w-full font-poly'
                aria-describedby='entry-submit-help'
                aria-busy={isSubmitting}
                disabled={isDraftBusy}>
                {isSubmitting ? <Icon name='spinner-ring' className='size-4' /> : null}
                <span>{isSaved ? 'Save changes' : 'Submit entry'}</span>
              </Button>
            )}
          </section>
        </div>

        <Activity mode={isSaved ? 'visible' : 'hidden'}>
          <section
            ref={paymentSectionRef}
            id='pay-with-qr-section'
            aria-labelledby='payment-section-title'
            className='scroll-mt-16 border-t border-border/60'>
            <header className='space-y-1 border-b border-border/60 px-6 py-5 md:px-8'>
              <h2 id='payment-section-title' className='font-poly text-lg font-medium text-foreground'>
                Payment
              </h2>
              <p className='text-sm leading-normal text-muted-foreground'>
                Transfer the amount due, then upload your proof of payment.
              </p>
            </header>

            <div className='grid min-h-80 md:grid-cols-3'>
              <section
                aria-labelledby='payment-details-title'
                className='flex flex-col justify-between gap-6 border-b border-border/60 p-6 md:border-e md:border-b-0'>
                <div className='space-y-6'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success-foreground'>
                      <Icon name='bank-transfer-in' className='size-5' />
                    </div>
                    <h3 id='payment-details-title' className='font-poly text-base font-medium text-foreground'>
                      Transfer details
                    </h3>
                  </div>

                  <div className='rounded-lg bg-muted/50 p-4'>
                    <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Amount due</p>
                    <p className='mt-1 font-poly text-2xl font-semibold text-foreground tabular-nums'>
                      {currencyFormatter.format(totalAmount)}
                    </p>
                  </div>

                  <dl className='space-y-4 text-sm'>
                    <div className='space-y-1'>
                      <dt className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Reference</dt>
                      <dd className='font-medium text-foreground break-all'>{formId}</dd>
                    </div>
                    <div className='space-y-1'>
                      <dt className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                        Payment service
                      </dt>
                      <dd className='text-foreground'>{paymentMethod?.bankOrEwallet ?? 'Unavailable'}</dd>
                    </div>
                    <div className='space-y-1'>
                      <dt className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>Account name</dt>
                      <dd className='text-foreground'>{paymentMethod?.accountName ?? 'Unavailable'}</dd>
                    </div>
                    <div className='space-y-1'>
                      <dt className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                        Account number
                      </dt>
                      <dd className='text-foreground break-all'>{paymentMethod?.accountNumber ?? 'Unavailable'}</dd>
                    </div>
                  </dl>
                </div>

                <div className='space-y-2'>
                  <div className='grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2'>
                    <Button
                      type='button'
                      variant='outline'
                      className='justify-center'
                      aria-describedby={paymentToolsErrorMessage ? paymentToolsErrorId : undefined}
                      disabled={!paymentDetails}
                      onClick={() => {
                        void copyPaymentDetails()
                      }}>
                      <Icon name={paymentDetailsCopied ? 'check' : 'copy'} className='size-4' />
                      <span>{paymentDetailsCopied ? 'Copied' : 'Copy details'}</span>
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      className='justify-center'
                      aria-busy={isDownloadingQr}
                      aria-describedby={paymentToolsErrorMessage ? paymentToolsErrorId : undefined}
                      disabled={!paymentQRCodeContent || isDownloadingQr}
                      onClick={downloadPaymentQR}>
                      <Icon name={isDownloadingQr ? 'spinner-ring' : 'down-to-line'} className='size-4' />
                      <span>{isDownloadingQr ? 'Downloading' : 'Download QR'}</span>
                    </Button>
                  </div>

                  <div role='status' aria-live='polite' aria-atomic='true' className='sr-only'>
                    {paymentDetailsCopied ? 'Payment details copied.' : null}
                  </div>

                  {paymentToolsErrorMessage ? (
                    <p
                      id={paymentToolsErrorId}
                      role='alert'
                      className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                      {paymentToolsErrorMessage}
                    </p>
                  ) : null}
                </div>
              </section>

              <section
                aria-labelledby='payment-qr-title'
                className='flex flex-col border-b border-border/60 p-6 md:border-e md:border-b-0'>
                <h3 id='payment-qr-title' className='font-poly text-base font-medium text-foreground'>
                  Scan to pay
                </h3>
                <div className='flex min-h-64 flex-1 items-center justify-center py-4'>
                  {paymentQRCodeContent ? (
                    <PaymentQR content={paymentQRCodeContent} />
                  ) : (
                    <div className='flex flex-col items-center justify-center gap-3 text-center text-muted-foreground'>
                      <Icon name='file' className='size-8' />
                      <p className='max-w-56 text-sm leading-normal'>
                        {paymentMethod
                          ? 'No QR code is available. Use the transfer details instead.'
                          : 'Payment details are unavailable. Contact the tournament organizer.'}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section aria-labelledby='receipt-upload-title' className='flex flex-col justify-between gap-6 p-6'>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                      <Icon name='upload' className='size-5' />
                    </div>
                    <h3 id='receipt-upload-title' className='font-poly text-base font-medium text-foreground'>
                      Proof of payment
                    </h3>
                  </div>

                  <input
                    ref={receiptInputRef}
                    id='payment-receipt'
                    type='file'
                    accept='image/png,image/jpeg,image/webp,image/avif,image/tiff,image/gif,image/bmp,application/pdf'
                    className='peer sr-only'
                    aria-describedby={`${receiptHintId}${receiptErrorMessage ? ` ${receiptErrorId}` : ''}`}
                    aria-invalid={receiptErrorMessage ? true : undefined}
                    disabled={!canChooseReceipt}
                    onChange={(event) => {
                      const nextReceiptFile = event.currentTarget.files?.[0] ?? null

                      if (receiptPreviewUrlRef.current) {
                        URL.revokeObjectURL(receiptPreviewUrlRef.current)
                        receiptPreviewUrlRef.current = null
                      }

                      if (nextReceiptFile?.type.startsWith('image/')) {
                        const nextPreviewUrl = URL.createObjectURL(nextReceiptFile)
                        receiptPreviewUrlRef.current = nextPreviewUrl
                        setReceiptPreviewUrl(nextPreviewUrl)
                      } else {
                        setReceiptPreviewUrl(null)
                      }

                      setReceiptFile(nextReceiptFile)
                      setReceiptErrorMessage(null)
                      setReceiptSuccessMessage(null)
                    }}
                  />

                  <label
                    htmlFor='payment-receipt'
                    aria-disabled={!canChooseReceipt}
                    className={cn(
                      'flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-input/20 text-center outline-hidden transition-colors peer-aria-invalid:border-destructive peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                      canChooseReceipt ? 'cursor-pointer hover:bg-input/40' : 'cursor-not-allowed opacity-60'
                    )}>
                    {receiptPreviewUrl ? (
                      <div className='relative size-full min-h-40'>
                        <Image
                          src={receiptPreviewUrl}
                          width={320}
                          height={200}
                          alt=''
                          className='absolute inset-0 size-full object-cover'
                        />
                        <div className='absolute inset-x-0 bottom-0 space-y-0.5 bg-background/90 px-3 py-2 text-start backdrop-blur-sm'>
                          <span className='block text-sm font-medium text-foreground'>Change receipt file</span>
                          <span className='block text-xs text-muted-foreground break-all'>{receiptFile?.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className='flex size-full min-h-40 flex-col items-center justify-center gap-3 px-4'>
                        <Icon
                          name={isEntryLocked || receiptFile ? 'check' : 'receipt-plus'}
                          className='size-8 text-foreground'
                        />
                        <span className='max-w-full text-sm font-medium text-foreground'>
                          {isEntryLocked
                            ? 'Receipt submitted'
                            : receiptFile
                              ? 'Change receipt file'
                              : 'Choose receipt file'}
                        </span>
                        {receiptFile ? (
                          <span className='max-w-full text-xs text-muted-foreground break-all'>{receiptFile.name}</span>
                        ) : null}
                      </div>
                    )}
                  </label>

                  <p id={receiptHintId} className='text-xs leading-normal text-muted-foreground'>
                    PNG, JPG, WebP, AVIF, TIFF, GIF, BMP, or PDF.
                  </p>

                  {receiptActionUnavailable ? (
                    <p className='text-sm leading-normal text-muted-foreground'>
                      Receipt uploads will open when the organizer adds payment details.
                    </p>
                  ) : null}

                  {receiptErrorMessage ? (
                    <p
                      id={receiptErrorId}
                      role='alert'
                      className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                      {receiptErrorMessage}
                    </p>
                  ) : null}

                  <div
                    role='status'
                    aria-live='polite'
                    aria-atomic='true'
                    className={cn(
                      receiptSuccessMessage
                        ? 'rounded-md bg-success/10 px-3 py-2 text-sm text-success-foreground'
                        : 'sr-only'
                    )}>
                    {receiptSuccessMessage}
                  </div>
                </div>

                <Button
                  id='submit-receipt'
                  type='button'
                  size='xl'
                  className='w-full font-poly'
                  aria-busy={isSubmittingReceipt}
                  disabled={
                    isEntryLocked ? !subscriptionId : !subscriptionId || isDraftBusy || receiptActionUnavailable
                  }
                  onClick={() => {
                    if (isEntryLocked && subscriptionId) {
                      router.push(`/subscriptions/${subscriptionId}`)
                    } else {
                      void submitReceipt()
                    }
                  }}>
                  {isSubmittingReceipt ? <Icon name='spinner-ring' className='size-4' /> : null}
                  <span>
                    {isEntryLocked
                      ? 'View entry'
                      : isAdmin && !receiptFile
                        ? 'Submit without receipt'
                        : 'Submit receipt'}
                  </span>
                </Button>
              </section>
            </div>
          </section>
        </Activity>

        {paymentMethod && paymentDownloadQrSvg ? (
          <div aria-hidden className='pointer-events-none fixed -left-2500 top-0 w-96'>
            <PaymentQRExportSurface
              ref={paymentQrExportRef}
              accountName={paymentMethod.accountName}
              accountNumber={paymentMethod.accountNumber}
              bankOrEwallet={paymentMethod.bankOrEwallet}
              qrSvg={paymentDownloadQrSvg}
            />
          </div>
        ) : null}
      </form>
    </form.AppForm>
  )
}

const PaymentQR = ({ content }: { content: string }) => {
  return (
    <div className='flex size-full items-center justify-center'>
      <QRCodeSVG
        className='rounded-lg bg-white p-2 shadow-sm [&_svg]:size-full'
        options={{
          content,
          width: 280,
          height: 280
        }}
      />
    </div>
  )
}
