'use client'

import { useAppForm } from '@/components/form'
import { createQRCodeSvg, QRCodeSVG } from '@/components/qrcode/viewer'
import { Button } from '@/components/ui/button'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { isSubscriptionEntryLocked } from '@/convex/subscriptions/policy'
import { useImageConverter } from '@/hooks/use-image-converter'
import { Icon } from '@/lib/icons'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Activity, useCallback, useEffect, useRef, useState } from 'react'
import { createTournamentSubscription, generateReceiptUploadUrl, updateTournamentSubscriptionReceipt } from './actions'

const entryControlClassName =
  'h-12 bg-input/40 hover:bg-input/40 focus-visible:bg-input/30 border-border/40 pr-3 py-1 font-ios text-foreground/80 text-sm shadow-none dark:bg-input/20 dark:hover:bg-input/20 dark:focus-visible:bg-input/20 dark:border-white/20'

type DivisionOption = {
  label: string
  value: string
}

type Subscription = Doc<'subscriptions'>

type PaymentMethod = {
  bankOrEwallet: string
  accountName: string
  accountNumber: string
  qrCodeContent: string | null
}

interface NewEntryFormProps {
  tourId: string
  formId: string
  players: number
  totalAmount: number
  division: string
  initialEmail: string
  initialPhone: string
  initialSubscription: Subscription | null
  paymentMethod: PaymentMethod | null
  divisionOptions: DivisionOption[]
  onPlayersChange: (nextPlayers: number) => void
  onDivisionChange: (nextDivision: string) => void
}

export const NewEntryForm = ({
  tourId,
  formId,
  players,
  totalAmount,
  division,
  initialEmail,
  initialPhone,
  initialSubscription,
  paymentMethod,
  divisionOptions,
  onPlayersChange,
  onDivisionChange
}: NewEntryFormProps) => {
  const initiallyLocked = isSubscriptionEntryLocked(initialSubscription)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(() =>
    initialSubscription && !initiallyLocked
      ? 'Entry request saved. You can update it until proof of payment is submitted.'
      : null
  )
  const [subscriptionId, setSubscriptionId] = useState<Id<'subscriptions'> | null>(initialSubscription?._id ?? null)
  const [didSubmitReceipt, setDidSubmitReceipt] = useState(false)
  const isEntryLocked = initiallyLocked || didSubmitReceipt
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)
  const receiptPreviewUrlRef = useRef<string | null>(null)
  const [receiptErrorMessage, setReceiptErrorMessage] = useState<string | null>(null)
  const [receiptSuccessMessage, setReceiptSuccessMessage] = useState<string | null>(() =>
    initiallyLocked
      ? initialSubscription?.status === 'cancelled'
        ? 'This entry is cancelled and can no longer be changed.'
        : 'Receipt uploaded. Payment is pending review.'
      : null
  )
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false)
  const [paymentCodeCopied, setPaymentCodeCopied] = useState(false)
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

      terminate()
    }
  }, [terminate])

  const form = useAppForm({
    defaultValues: {
      fullName: initiallyLocked
        ? (initialSubscription?.team_name ?? '')
        : (entryQuery.teamName ?? initialSubscription?.team_name ?? ''),
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
            ? 'Entry changes saved. You can continue editing until proof of payment is submitted.'
            : 'Entry request saved. You can update it until proof of payment is submitted.'
        )
      } catch {
        setErrorMessage('Unable to save this entry request.')
      }
    }
  })
  const isSubmitting = form.state.isSubmitting
  const isSaved = subscriptionId !== null
  const isDraftBusy = isSubmitting || isSubmittingReceipt
  const paymentQRCodeContent = paymentMethod?.qrCodeContent ?? null
  const hasActivePaymentDestination = Boolean(paymentMethod && paymentQRCodeContent)
  const copyPaymentCode = useCallback(async () => {
    if (!navigator.clipboard || !paymentQRCodeContent) {
      return
    }

    await navigator.clipboard.writeText(paymentQRCodeContent)
    setPaymentCodeCopied(true)
    window.setTimeout(() => {
      setPaymentCodeCopied(false)
    }, 1600)
  }, [paymentQRCodeContent])
  const downloadPaymentQR = useCallback(() => {
    if (!paymentQRCodeContent) {
      return
    }

    const svg = createQRCodeSvg({
      content: paymentQRCodeContent,
      width: 400,
      height: 400
    })
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${formId}-payment-qr.svg`
    link.click()
    URL.revokeObjectURL(url)
  }, [formId, paymentQRCodeContent])
  const submitReceipt = useCallback(async () => {
    if (!receiptFile || !subscriptionId || isEntryLocked) {
      return
    }

    setReceiptErrorMessage(null)
    setReceiptSuccessMessage(null)
    setIsSubmittingReceipt(true)

    try {
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
  }, [convert, formId, isEntryLocked, receiptFile, subscriptionId])

  const router = useRouter()

  return (
    <form.AppForm>
      <form
        aria-busy={isDraftBusy}
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}>
        <div className='grid md:grid-cols-3'>
          <div className='md:border-r border-slate-400 dark:border-slate-900 p-4 md:p-8'>
            <form.AppField name='email'>
              {({ TextField }) => (
                <TextField
                  id='book-email'
                  label='Contact'
                  icon='mail'
                  type='email'
                  placeholder='you@example.com'
                  autoComplete='email'
                  required
                  containerClassName='mb-4'
                  className={entryControlClassName}
                  disabled={isDraftBusy || isEntryLocked}
                  onChange={(event) => {
                    void setEntryQuery({ email: event.currentTarget.value || null })
                  }}></TextField>
              )}
            </form.AppField>
            <form.AppField name='phone'>
              {({ TextField }) => (
                <TextField
                  id='book-phone'
                  type='tel'
                  label='Phone (Optional)'
                  icon='phone-accept'
                  placeholder='+63'
                  autoComplete='tel'
                  required={false}
                  containerClassName='mb-0'
                  className={entryControlClassName}
                  disabled={isDraftBusy || isEntryLocked}
                  onChange={(event) => {
                    void setEntryQuery({ phone: event.currentTarget.value || null })
                  }}
                />
              )}
            </form.AppField>
          </div>
          <div className='bg-sky-500/0 md:p-8 p-4 md:border-r border-slate-400 dark:border-slate-900'>
            <form.AppField name='fullName'>
              {({ TextField }) => (
                <TextField
                  id='name'
                  type='text'
                  label='Full Name'
                  icon={'user'}
                  placeholder='Your first and last name'
                  autoComplete='organization'
                  containerClassName='mb-4'
                  className={entryControlClassName}
                  disabled={isDraftBusy || isEntryLocked}
                  onChange={(event) => {
                    void setEntryQuery({ teamName: event.currentTarget.value || null })
                  }}></TextField>
              )}
            </form.AppField>
            <form.AppField name='playerCount'>
              {({ TextField }) => (
                <TextField
                  id='book-players'
                  label='Number of Players'
                  type='number'
                  icon='person-multiple'
                  min='1'
                  max='20'
                  required
                  containerClassName='mb-4'
                  className={entryControlClassName}
                  disabled={isDraftBusy || isEntryLocked}
                  onChange={(event) => {
                    const nextPlayers = Number.parseInt(event.currentTarget.value, 10)
                    const playerCount = Number.isNaN(nextPlayers) ? players : nextPlayers
                    onPlayersChange(playerCount)
                  }}></TextField>
              )}
            </form.AppField>
            {/*<div className='h-28 bg-slate-100 rounded-md'></div>*/}
            <div className='hidden _flex flex-col gap-4 sm:flex-row sm:items-start'>
              <form.AppField name='division'>
                {({ SelectField }) => (
                  <SelectField
                    id='book-division'
                    label='Division'
                    options={divisionOptions}
                    containerClassName='mb-0'
                    disabled={isDraftBusy || isEntryLocked}
                    onChange={(event) => {
                      const nextDivision = event.currentTarget.value
                      onDivisionChange(nextDivision)
                      void setEntryQuery({ division: nextDivision || null })
                    }}
                  />
                )}
              </form.AppField>
              <form.AppField name='handicapIndex'>
                {({ TextField }) => (
                  <TextField
                    id='book-handicap'
                    type='number'
                    icon='golf-flag'
                    label='Handicap'
                    placeholder='Optional'
                    containerClassName='mb-0'
                    className={entryControlClassName}
                    disabled={isDraftBusy || isEntryLocked}
                    onChange={(event) => {
                      void setEntryQuery({ handicapIndex: event.currentTarget.value || null })
                    }}
                  />
                )}
              </form.AppField>
            </div>
          </div>

          <div className='h-full flex flex-col gap-4 md:gap-8 md:pt-4 text-center md:justify-center bg-sky-500/0'>
            <p className='font-okx text-foreground/80 text-xs md:text-base text-balance text-center'>
              By continuing, you reserve a request for <span className='px-2 font-medium'>{tourId}</span>. Confirmation
              follows payment review.
            </p>
            {errorMessage ? (
              <p role='alert' className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <div
                role='status'
                className='flex items-center justify-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'>
                <Icon name='check' className='size-4' />
                <span>{successMessage}</span>
              </div>
            ) : null}
            <div className='flex items-center justify-center w-full px-8 mb-8 md:mb-0'>
              <Button
                size='xl'
                type='submit'
                variant='default'
                className='w-full bg-slate-900 dark:bg-background text-white/80 md:min-w-64'
                disabled={isDraftBusy || isEntryLocked}>
                {isSubmitting ? <Icon name='spinner-ring' className='size-4' /> : null}
                <span className='px-2 font-poly capitalize'>
                  {isEntryLocked ? 'Entry Locked' : isSaved ? 'Save Changes' : 'Submit Entries'}
                </span>
                {isEntryLocked ? <Icon name='check' className='size-4' /> : null}
              </Button>
            </div>
          </div>
        </div>

        {/* PAYMENTS */}
        <Activity mode={isSaved ? 'visible' : 'hidden'}>
          <div className='grid min-h-80 border-t border-slate-400 dark:border-slate-900 md:grid-cols-3'>
            <div className='flex flex-col justify-between gap-6 border-b border-slate-400 p-6 dark:border-slate-900 md:border-b-0 md:border-r'>
              <div className='space-y-6'>
                <div className='flex items-center gap-4'>
                  <div className='flex size-9 items-center justify-center rounded-lg bg-emerald-100/10 dark:text-emerald-100'>
                    <Icon name='bank-transfer-in' className='size-6' />
                  </div>
                  <div>
                    <p className='font-okx text-lg text-foreground'>Pay with QR</p>
                  </div>
                </div>
                <div className='md:flex justify-start space-y-6 md:space-x-0 md:flex-col text-left'>
                  <div className='space-y-1'>
                    <p className='font-ios text-[10px] md:text-xs uppercase tracking-widest dark:text-slate-300/80'>
                      Reference Number
                    </p>
                    <p className='font-okx font-medium text-sm md:text-base uppercase text-foreground tracking-wide'>
                      {formId}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <p className='font-ios font-light text-[10px] md:text-xs uppercase tracking-widest dark:text-slate-300/80 whitespace-nowrap'>
                      Account Name
                    </p>
                    <p className='font-okx font-medium text-sm md:text-base text-foreground tracking-wide'>
                      {paymentMethod?.accountName ?? 'Unavailable'}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <p className='font-ios text-[10px] md:text-xs uppercase tracking-widest dark:text-slate-300/80 whitespace-nowrap'>
                      Account Number
                    </p>
                    <p className='font-okx font-medium text-sm md:text-base text-foreground tracking-wide'>
                      {paymentMethod ? `${paymentMethod.bankOrEwallet} ${paymentMethod.accountNumber}` : 'Unavailable'}
                    </p>
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  className='justify-center'
                  disabled={!paymentQRCodeContent}
                  onClick={() => {
                    void copyPaymentCode()
                  }}>
                  <Icon name={paymentCodeCopied ? 'check' : 'copy'} className='size-4' />
                  <span>{paymentCodeCopied ? 'Copied' : 'Copy QR'}</span>
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  className='justify-center'
                  disabled={!paymentQRCodeContent}
                  onClick={downloadPaymentQR}>
                  <Icon name='down-to-line' className='size-4' />
                  <span>Download QR</span>
                </Button>
              </div>
            </div>
            <div className='flex items-center justify-center border-b border-slate-400 p-4 dark:border-slate-900 md:border-b-0 md:border-r'>
              {paymentQRCodeContent ? (
                <PaymentQR content={paymentQRCodeContent} />
              ) : (
                <div className='flex min-h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground'>
                  <Icon name='file' className='size-8' />
                  <p className='text-sm'>Payment QR is unavailable.</p>
                </div>
              )}
            </div>
            <div className='flex flex-col justify-between gap-6 p-8'>
              <div className='space-y-4'>
                <div className='flex items-center space-x-4'>
                  <div className='flex size-9 items-center justify-center rounded-lg bg-sky-100/10 dark:text-sky-100'>
                    <Icon name='upload' className='size-5' />
                  </div>
                  <p className='font-okx text-lg text-foreground'>Upload your proof of payment.</p>
                  {/*<p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Proof of transfer</p>*/}
                </div>
                <label
                  htmlFor='payment-receipt'
                  aria-disabled={isEntryLocked}
                  className={`flex h-40 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-400 bg-input/20 text-center transition-colors dark:border-slate-700 ${
                    isEntryLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-input/30'
                  }`}>
                  {receiptPreviewUrl ? (
                    <Image
                      src={receiptPreviewUrl}
                      width={200}
                      height={200}
                      alt='Selected receipt preview'
                      className='size-full object-cover'
                    />
                  ) : (
                    <div className='flex size-full flex-col items-center justify-center gap-3 px-4'>
                      <Icon
                        name={isEntryLocked || receiptFile ? 'check' : 'receipt-plus'}
                        className='size-10 text-foreground'
                      />
                      <span className='max-w-full truncate font-okx dark:text-sky-400 text-sm text-foreground tracking-wide'>
                        {isEntryLocked ? 'Receipt submitted' : receiptFile ? receiptFile.name : 'Browse receipt file'}
                      </span>
                      <span className='font-ios text-[9px] md:text-xs dark:text-slate-300'>
                        PNG, JPG, WEBP, AVIF, TIFF
                      </span>
                    </div>
                  )}
                </label>
                <input
                  id='payment-receipt'
                  type='file'
                  accept='image/png,image/jpeg,image/webp,image/avif,image/tiff,image/gif,image/bmp,application/pdf'
                  className='sr-only'
                  disabled={isEntryLocked || isDraftBusy}
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
                {receiptErrorMessage ? (
                  <p role='alert' className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                    {receiptErrorMessage}
                  </p>
                ) : null}
                {receiptSuccessMessage ? (
                  <p role='status' className='rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'>
                    {receiptSuccessMessage}
                  </p>
                ) : null}
              </div>
              <Button
                type='button'
                size='xl'
                variant='default'
                className='w-full bg-slate-900 text-white/80 dark:bg-background'
                disabled={
                  isEntryLocked
                    ? !subscriptionId
                    : !hasActivePaymentDestination || !receiptFile || !subscriptionId || isDraftBusy
                }
                onClick={() => {
                  if (isEntryLocked && subscriptionId) {
                    router.push(`/subscriptions/${subscriptionId}`)
                  } else {
                    void submitReceipt()
                  }
                }}>
                {isSubmittingReceipt ? <Icon name='spinner-ring' className='size-4' /> : null}
                <span className='font-poly capitalize'>
                  {isEntryLocked ? 'View Entry' : receiptFile ? 'Submit Receipt' : 'Receipt Required'}
                </span>
              </Button>
            </div>
          </div>
        </Activity>
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
