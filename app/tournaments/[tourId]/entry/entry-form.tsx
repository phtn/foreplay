'use client'

import { useAppForm } from '@/components/form'
import { createQRCodeSvg, QRCodeSVG } from '@/components/qrcode/viewer'
import { Button } from '@/components/ui/button'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { Activity, useCallback, useEffect, useRef, useState } from 'react'
import { createTournamentSubscription, generateReceiptUploadUrl, updateTournamentSubscriptionReceipt } from './actions'

const entryControlClassName =
  'h-9 bg-input/40 hover:bg-input/40 focus-visible:bg-input/30 border-border/40 pr-3 py-1 font-ios text-foreground/80 text-sm shadow-none dark:bg-input/20 dark:hover:bg-input/20 dark:focus-visible:bg-input/20 dark:border-white/20'
const paymentQRCodeContent =
  '00020101021127590012com.p2pqrpay0111GOTYPHM2XXX02089996440304120113505139755204601653036085802PH5921MARLON JOAKIM TABLIZO6013Caloocan City6304B9FD'
const paymentReceiver = 'MARLON JOAKIM TABLIZO'

type DivisionOption = {
  label: string
  value: string
}

type Subscription = Doc<'subscriptions'>

interface NewEntryFormProps {
  tourId: string
  formId: string
  players: number
  totalAmount: number
  division: string
  initialEmail: string
  initialPhone: string
  initialSubscription: Subscription | null
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
  divisionOptions,
  onPlayersChange,
  onDivisionChange
}: NewEntryFormProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(() =>
    initialSubscription
      ? `Entry request saved. Subscription ${initialSubscription._id} is pending payment review.`
      : null
  )
  const [subscriptionId, setSubscriptionId] = useState<Id<'subscriptions'> | null>(initialSubscription?._id ?? null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)
  const receiptPreviewUrlRef = useRef<string | null>(null)
  const [receiptErrorMessage, setReceiptErrorMessage] = useState<string | null>(null)
  const [receiptSuccessMessage, setReceiptSuccessMessage] = useState<string | null>(() =>
    initialSubscription?.receipt_image_url || initialSubscription?.status === 'payment_review'
      ? 'Receipt uploaded. Payment is pending review.'
      : null
  )
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false)
  const [paymentCodeCopied, setPaymentCodeCopied] = useState(false)
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
    }
  }, [])

  const form = useAppForm({
    defaultValues: {
      fullName: initialSubscription?.team_name ?? entryQuery.teamName ?? '',
      email: initialSubscription?.contact_email ?? entryQuery.email ?? initialEmail,
      phone: initialSubscription?.contact_phone ?? entryQuery.phone ?? initialPhone,
      division: initialSubscription?.division ?? division,
      playerCount: String(initialSubscription?.total_players ?? entryQuery.players ?? players),
      handicapIndex: initialSubscription?.handicap_index ?? entryQuery.handicapIndex ?? ''
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)
      setSuccessMessage(null)

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

        setSubscriptionId(result.subscriptionId)
        setSuccessMessage(`Entry request saved. Subscription ${result.subscriptionId} is pending payment review.`)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to save this entry request.')
      }
    }
  })
  const isSubmitting = form.state.isSubmitting
  const isSaved = subscriptionId !== null
  const copyPaymentCode = useCallback(async () => {
    if (!navigator.clipboard) {
      return
    }

    await navigator.clipboard.writeText(paymentQRCodeContent)
    setPaymentCodeCopied(true)
    window.setTimeout(() => {
      setPaymentCodeCopied(false)
    }, 1600)
  }, [])
  const downloadPaymentQR = useCallback(() => {
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
  }, [formId])
  const submitReceipt = useCallback(async () => {
    if (!receiptFile || !subscriptionId) {
      return
    }

    setReceiptErrorMessage(null)
    setReceiptSuccessMessage(null)
    setIsSubmittingReceipt(true)

    try {
      const uploadUrl = await generateReceiptUploadUrl()
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': receiptFile.type || 'application/octet-stream'
        },
        body: receiptFile
      })

      if (!uploadResponse.ok) {
        throw new Error('Unable to upload this receipt file.')
      }

      const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> }

      await updateTournamentSubscriptionReceipt({
        subscriptionId,
        formId,
        storageId
      })

      setReceiptSuccessMessage('Receipt uploaded. Payment is pending review.')
    } catch (error) {
      setReceiptErrorMessage(error instanceof Error ? error.message : 'Unable to submit this receipt.')
    } finally {
      setIsSubmittingReceipt(false)
    }
  }, [formId, receiptFile, subscriptionId])

  const router = useRouter()

  return (
    <form.AppForm>
      <form
        aria-busy={isSubmitting}
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}>
        <div className='grid md:grid-cols-3'>
          <div className='md:border-r border-slate-400 dark:border-slate-800 p-4 md:p-8'>
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
                  disabled={isSubmitting || isSaved}
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
                  disabled={isSubmitting || isSaved}
                  onChange={(event) => {
                    void setEntryQuery({ phone: event.currentTarget.value || null })
                  }}
                />
              )}
            </form.AppField>
          </div>

          <div className='bg-sky-500/0 p-8 md:border-r border-slate-400 dark:border-slate-800'>
            <form.AppField name='fullName'>
              {({ TextField }) => (
                <TextField
                  id='name'
                  type='text'
                  label='Team Name (Optional)'
                  icon={'pentagon'}
                  placeholder='Team A'
                  autoComplete='organization'
                  containerClassName='mb-4'
                  className={entryControlClassName}
                  disabled={isSubmitting || isSaved}
                  onChange={(event) => {
                    void setEntryQuery({ teamName: event.currentTarget.value || null })
                  }}></TextField>
              )}
            </form.AppField>
            <form.AppField name='playerCount'>
              {({ TextField }) => (
                <TextField
                  id='book-players'
                  label='Number of Entries'
                  type='number'
                  icon='person-multiple'
                  min='1'
                  max='4'
                  required
                  containerClassName='mb-4'
                  className={entryControlClassName}
                  disabled={isSubmitting || isSaved}
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
                    disabled={isSubmitting || isSaved}
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
                    disabled={isSubmitting || isSaved}
                    onChange={(event) => {
                      void setEntryQuery({ handicapIndex: event.currentTarget.value || null })
                    }}
                  />
                )}
              </form.AppField>
            </div>
          </div>

          <div className='h-full flex flex-col gap-4 md:gap-8 md:pt-4 text-center md:justify-center bg-sky-500/0'>
            <p className='font-okx text-foreground/80 text-base text-balance text-center'>
              By continuing, you reserve a request for <span className='px-2 font-medium'>{tourId}</span>. Confirmation
              follows payment review.
            </p>
            {errorMessage ? (
              <p role='alert' className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p role='status' className='hidden rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'>
                {successMessage}
              </p>
            ) : null}
            <div className='flex items-center justify-center w-full px-8 mb-8 md:mb-0'>
              <Button
                size='xl'
                type='submit'
                variant='default'
                className='w-full bg-slate-900 dark:bg-background text-white/80 md:min-w-64'
                disabled={isSubmitting || isSaved}>
                {isSubmitting ? <Icon name='spinner-ring' className='size-4' /> : null}
                <span className='px-2 font-poly capitalize'>{isSaved ? 'Submitted' : 'Submit Entries'}</span>
                {isSaved && <Icon name='check' className='size-4' />}
              </Button>
            </div>
          </div>
        </div>

        {/* PAYMENTS */}
        <Activity mode={isSaved ? 'visible' : 'hidden'}>
          <div className='grid min-h-80 border-t border-slate-400 dark:border-slate-800 md:grid-cols-3'>
            <div className='flex flex-col justify-between gap-6 border-b border-slate-400 p-8 dark:border-slate-800 md:border-b-0 md:border-r'>
              <div className='space-y-5'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'>
                    <Icon name='lock' className='size-5' />
                  </div>
                  <div>
                    <p className='font-okx text-lg text-foreground'>Secure Payment</p>
                    <p className='font-okx text-xs tracking-widest text-muted-foreground'>
                      Scan QR Code to make a payment
                    </p>
                  </div>
                </div>
                <div className='flex justify-start space-x-6 md:space-x-0 md:flex-col space-y-3 text-left'>
                  <div>
                    <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Reference</p>
                    <p className='font-okx text-sm uppercase text-foreground/80'>{formId}</p>
                  </div>
                  <div>
                    <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Recipient</p>
                    <p className='font-okx text-sm text-foreground/80'>{paymentReceiver}</p>
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  className='justify-center'
                  onClick={() => {
                    void copyPaymentCode()
                  }}>
                  <Icon name={paymentCodeCopied ? 'check' : 'copy'} className='size-4' />
                  <span>{paymentCodeCopied ? 'Copied' : 'Copy Reference #'}</span>
                </Button>
                <Button type='button' variant='outline' className='justify-center' onClick={downloadPaymentQR}>
                  <Icon name='down-to-line' className='size-4' />
                  <span>Download QR</span>
                </Button>
              </div>
            </div>
            <div className='flex items-center justify-center border-b border-slate-400 p-4 dark:border-slate-800 md:border-b-0 md:border-r'>
              <PaymentQR content={paymentQRCodeContent} />
            </div>
            <div className='flex flex-col justify-between gap-6 p-8'>
              <div className='space-y-4'>
                <div>
                  <p className='font-okx text-lg text-foreground'>Upload Receipt</p>
                  <p className='font-ios text-xs uppercase tracking-widest text-muted-foreground'>Proof of transfer</p>
                </div>
                <label
                  htmlFor='payment-receipt'
                  className='flex h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-400 bg-input/20 text-center transition-colors hover:bg-input/30 dark:border-slate-700'>
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
                      <Icon name={receiptFile ? 'check' : 'file'} className='size-8 text-foreground/50' />
                      <span className='max-w-full truncate font-okx text-sm text-foreground/80'>
                        {receiptFile ? receiptFile.name : 'Choose receipt file'}
                      </span>
                      <span className='font-ios text-xs text-muted-foreground'>
                        PNG, JPG, WEBP, AVIF, TIFF, GIF, BMP, PDF
                      </span>
                    </div>
                  )}
                </label>
                <input
                  id='payment-receipt'
                  type='file'
                  accept='image/png,image/jpeg,image/webp,image/avif,image/tiff,image/gif,image/bmp,application/pdf'
                  className='sr-only'
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
                disabled={(!receiptFile && !receiptSuccessMessage) || !subscriptionId || isSubmittingReceipt}
                onClick={() => {
                  if (receiptSuccessMessage) {
                    router.push(`/subscriptions/${subscriptionId}`)
                  } else {
                    void submitReceipt()
                  }
                }}>
                {isSubmittingReceipt ? <Icon name='spinner-ring' className='size-4' /> : null}
                <span className='font-poly capitalize'>
                  {receiptSuccessMessage ? 'View Entry' : receiptFile ? 'Submit Receipt' : 'Receipt Required'}
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
