'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { onInfo, onSuccess } from '@/ctx/toast'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { type SubmitEvent, useRef, useState, useTransition } from 'react'
import { confirmSubscription } from '../../actions'
import {
  deletePlayerRegistration,
  generateAdminReceiptUploadUrl,
  saveAdminReceipt,
  saveRegistrationDetails,
  type SaveRegistrationDetailsState
} from './actions'

export type RegistrationEditorPlayer = {
  checkedIn: boolean
  division?: string
  handicapIndex: string
  playerEmail: string
  playerName: string
  playerPhone: string
  registrationId: string
  shirtSize: string
}

export type RegistrationEditorEntry = {
  contactEmail: string
  contactPhone: string
  confirmedAt: number | null
  confirmedBy: string | null
  division?: string
  handicapIndex: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  receiptUrl: string | null
  subscriptionId: string
  subscriptionStatus: string
  teamName: string
}

type RegistrationEditorProps = {
  canDeletePlayers: boolean
  divisionOptions: string[]
  entry: RegistrationEditorEntry
  eventId: string
  players: RegistrationEditorPlayer[]
}

const initialState: SaveRegistrationDetailsState = {
  message: '',
  status: 'idle'
}

const inputClassName =
  'h-11 border-border/70 bg-background shadow-none focus-visible:border-primary focus-visible:ring-primary/15'
const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024
const confirmedAtFormatter = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Manila'
})

export function RegistrationEditor({
  canDeletePlayers,
  divisionOptions,
  entry,
  eventId,
  players
}: RegistrationEditorProps) {
  const router = useRouter()
  const { isLoading: isAuthLoading, user } = useFirebaseUser()
  const [state, setState] = useState(initialState)
  const [deletingRegistrationId, setDeletingRegistrationId] = useState<string | null>(null)
  const [pendingOperation, setPendingOperation] = useState<'save' | 'delete' | 'confirm' | 'receipt' | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const isSaving = isPending && pendingOperation === 'save'
  const isConfirmingPayment = isPending && pendingOperation === 'confirm'
  const isUploadingReceipt = isPending && pendingOperation === 'receipt'
  const isPaymentConfirmed = entry.paymentStatus === 'paid' && entry.subscriptionStatus === 'confirmed'

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setState(initialState)
    setPendingOperation('save')
    startTransition(async () => {
      try {
        if (!user) {
          throw new Error('Your admin session is still loading. Try again in a moment.')
        }

        const firebaseIdToken = await user.getIdToken(true)
        const result = await saveRegistrationDetails(formData, firebaseIdToken)
        setState(result)

        if (result.status === 'success') {
          router.refresh()
          onSuccess('Save Successful')
        }
      } catch (error) {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to save registration details. Try again.'
        })
      } finally {
        setPendingOperation(null)
      }
    })
  }

  const handleDelete = (player: RegistrationEditorPlayer) => {
    const confirmationMessage =
      players.length === 1
        ? `Delete ${player.playerName}'s registration and remove this entry from the players table? This action cannot be undone.`
        : `Delete ${player.playerName}'s registration? This action cannot be undone.`

    if (!window.confirm(confirmationMessage)) {
      return
    }

    setState(initialState)
    setDeletingRegistrationId(player.registrationId)
    setPendingOperation('delete')

    startTransition(async () => {
      const formData = new FormData()
      formData.set('eventId', eventId)
      formData.set('subscriptionId', entry.subscriptionId)
      formData.set('registrationId', player.registrationId)

      try {
        if (!user) {
          throw new Error('Your Top G session is still loading. Try again in a moment.')
        }

        const firebaseIdToken = await user.getIdToken(true)
        const result = await deletePlayerRegistration(formData, firebaseIdToken)
        setState(result)

        if (result.status === 'success') {
          if (result.deletedSubscription) {
            router.replace(`/admin/${encodeURIComponent(eventId)}`)
            onInfo('Player Deleted')
          } else {
            router.refresh()
          }
        }
      } catch (error) {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to delete this player registration. Try again.'
        })
      } finally {
        setDeletingRegistrationId(null)
        setPendingOperation(null)
      }
    })
  }

  const handleConfirmPayment = () => {
    setState(initialState)
    setPendingOperation('confirm')

    startTransition(async () => {
      try {
        if (!user) {
          throw new Error('Your admin session is still loading. Try again in a moment.')
        }

        const firebaseIdToken = await user.getIdToken(true)
        await confirmSubscription({ eventId, subscriptionId: entry.subscriptionId }, firebaseIdToken)
        setState({ status: 'success', message: 'Payment confirmed and tickets are active.' })
        router.refresh()
        onSuccess('Payment Confirmed')
      } catch (error) {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to confirm payment. Try again.'
        })
      } finally {
        setPendingOperation(null)
      }
    })
  }

  const handleUploadReceipt = () => {
    if (!receiptFile) {
      setState({ status: 'error', message: 'Choose an image receipt to upload.' })
      return
    }

    if (!receiptFile.type.startsWith('image/')) {
      setState({ status: 'error', message: 'Receipt must be an image.' })
      return
    }

    if (receiptFile.size > MAX_RECEIPT_SIZE_BYTES) {
      setState({ status: 'error', message: 'Receipt image must be 10 MB or smaller.' })
      return
    }

    const file = receiptFile
    setState(initialState)
    setPendingOperation('receipt')

    startTransition(async () => {
      try {
        if (!user) {
          throw new Error('Your admin session is still loading. Try again in a moment.')
        }

        const firebaseIdToken = await user.getIdToken(true)
        const uploadUrl = await generateAdminReceiptUploadUrl(
          { eventId, subscriptionId: entry.subscriptionId },
          firebaseIdToken
        )
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file
        })

        if (!uploadResponse.ok) {
          throw new Error('Receipt upload failed. Try again.')
        }

        const uploadResult: unknown = await uploadResponse.json()

        if (
          typeof uploadResult !== 'object' ||
          uploadResult === null ||
          !('storageId' in uploadResult) ||
          typeof uploadResult.storageId !== 'string'
        ) {
          throw new Error('The receipt upload response was invalid. Try again.')
        }

        const result = await saveAdminReceipt(
          { eventId, subscriptionId: entry.subscriptionId, storageId: uploadResult.storageId },
          firebaseIdToken
        )
        setState(result)

        if (result.status === 'success') {
          setReceiptFile(null)
          if (receiptInputRef.current) {
            receiptInputRef.current.value = ''
          }
          router.refresh()
          onSuccess('Receipt Uploaded')
        }
      } catch (error) {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to upload the receipt. Try again.'
        })
      } finally {
        setPendingOperation(null)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      onReset={() => setReceiptFile(null)}
      aria-busy={isPending}
      className='space-y-5'>
      <input type='hidden' name='eventId' value={eventId} />
      <input type='hidden' name='subscriptionId' value={entry.subscriptionId} />

      <datalist id='admin-registration-divisions'>
        {divisionOptions.map((division) => (
          <option key={division} value={division} />
        ))}
      </datalist>

      <fieldset disabled={isPending} className='space-y-5'>
        <Card size='sm' className='gap-0 ring-0 py-0'>
          <CardHeader className='border-b border-border/60 py-4'>
            <CardTitle className='font-okx text-base'>Payment</CardTitle>
            <CardDescription>Upload a receipt or confirm payment manually.</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-5 px-0 py-5 md:grid-cols-2'>
            <div className='flex min-w-0 flex-col items-start gap-3 px-1'>
              <div className='flex flex-wrap gap-2'>
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-1 font-ios text-[10px] uppercase tracking-widest',
                    entry.paymentStatus === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : entry.paymentStatus === 'failed' || entry.paymentStatus === 'refunded'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-orange-500/10 text-orange-700 dark:text-orange-300'
                  )}>
                  Payment {entry.paymentStatus}
                </span>
                <span className='inline-flex rounded-full bg-muted px-2.5 py-1 font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>
                  {entry.subscriptionStatus.replaceAll('_', ' ')}
                </span>
              </div>

              {entry.receiptUrl ? (
                <a
                  href={entry.receiptUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex min-h-10 items-center gap-2 text-sm font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-300'>
                  <Icon name='receipt' className='size-4' />
                  View uploaded receipt
                </a>
              ) : (
                <p className='text-sm text-muted-foreground'>No image receipt uploaded.</p>
              )}

              {entry.confirmedBy ? (
                <p className='text-xs text-muted-foreground'>
                  Confirmed by {entry.confirmedBy}
                  {entry.confirmedAt
                    ? ` · ${confirmedAtFormatter.format(entry.confirmedAt)}`
                    : ''}
                </p>
              ) : null}

              {isPaymentConfirmed && players.length > 0 ? (
                <p className='inline-flex min-h-10 items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300'>
                  <Icon name='check' className='size-4' />
                  Payment confirmed
                </p>
              ) : (
                <Button
                  type='button'
                  disabled={isPending || isAuthLoading || !user}
                  onClick={handleConfirmPayment}
                  className='gap-2 font-poly text-white bg-foreground dark:text-background hover:bg-foreground/90'>
                  {isConfirmingPayment ? <Icon name='spinner-ring' className='size-4' /> : null}
                  {isConfirmingPayment
                    ? 'Confirming ...'
                    : isPaymentConfirmed
                      ? 'Generate ticket'
                      : 'Confirm payment'}
                </Button>
              )}
            </div>

            <div className='grid min-w-0 gap-3 px-1'>
              <div className='grid gap-2'>
                <Label htmlFor='admin-payment-receipt-file' className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>
                  Receipt image
                </Label>
                <Input
                  ref={receiptInputRef}
                  id='admin-payment-receipt-file'
                  type='file'
                  accept='image/*'
                  className={cn(inputClassName, 'h-auto min-h-11 py-2 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs')}
                  onChange={(event) => setReceiptFile(event.currentTarget.files?.[0] ?? null)}
                />
                <p className='text-xs text-muted-foreground'>Choose an image up to 10 MB.</p>
                <p className='sr-only' role='status' aria-live='polite' aria-atomic='true'>
                  {receiptFile ? `Selected receipt image ${receiptFile.name}.` : ''}
                </p>
                {receiptFile ? (
                  <p className='truncate text-xs text-foreground/80'>
                    Selected: {receiptFile.name} ({Math.max(1, Math.ceil(receiptFile.size / 1024))} KB)
                  </p>
                ) : null}
              </div>
              <Button
                type='button'
                variant='outline'
                disabled={isPending || isAuthLoading || !user || !receiptFile}
                onClick={handleUploadReceipt}
                className='gap-2 sm:justify-self-start'>
                {isUploadingReceipt ? <Icon name='spinner-ring' className='size-4' /> : <Icon name='receipt' className='size-4' />}
                {isUploadingReceipt ? 'Uploading ...' : 'Upload receipt'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card size='sm' className='gap-0 ring-0 py-0'>
          <CardContent className='grid gap-4 px-0 py-5 md:grid-cols-2'>
            <EditorField
              id='registration-team-name'
              label='Player name'
              name='teamName'
              defaultValue={entry.teamName}
              maxLength={120}
              autoComplete='organization'
            />
            <EditorField
              id='registration-contact-email'
              label='Contact email'
              name='contactEmail'
              type='email'
              defaultValue={entry.contactEmail}
              maxLength={320}
              autoComplete='email'
              required
            />
            <EditorField
              id='registration-contact-phone'
              label='Contact phone'
              name='contactPhone'
              type='tel'
              defaultValue={entry.contactPhone}
              maxLength={64}
              autoComplete='tel'
            />
            <EditorField
              id='registration-handicap'
              label='Handicap index'
              name='handicapIndex'
              defaultValue={entry.handicapIndex}
              maxLength={64}
            />
            {/*<EditorField
              id='registration-division'
              label='Division'
              name='division'
              defaultValue={entry.division}
              maxLength={120}
              list='admin-registration-divisions'
            />*/}
          </CardContent>
        </Card>

        <section className='space-y-3' aria-labelledby='registered-players-title'>
          <div className='flex items-end justify-between gap-4 px-1'>
            <div>
              <h2 id='registered-players-title' className='font-okx text-base font-semibold'>
                Player Ticket Details
              </h2>
              <p className='text-sm text-muted-foreground'>Player changes are reflected on their active ticket.</p>
            </div>
            <span className='shrink-0 font-ios text-xs uppercase tracking-widest text-muted-foreground'>
              {players.length} {players.length === 1 ? 'player' : 'players'}
            </span>
          </div>

          {players.length ? (
            <div className='grid gap-4'>
              {players.map((player, index) => {
                const prefix = `registration.${player.registrationId}`
                const idPrefix = `registration-${player.registrationId}`

                return (
                  <Card key={player.registrationId} size='sm' className='gap-0 rounded-xl py-0'>
                    <input type='hidden' name='registrationId' value={player.registrationId} />
                    <CardHeader className='flex flex-row items-center justify-between gap-4 border-b border-border/60 py-4'>
                      <div className='min-w-0'>
                        <CardTitle className='truncate font-okx text-base'>Player {index + 1}</CardTitle>
                        <CardDescription className='truncate'>{player.playerName}</CardDescription>
                      </div>
                      <div className='flex flex-col justify-center'>
                        <span className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>
                          Ticket details
                        </span>
                        {canDeletePlayers && !player.checkedIn ? (
                          <Button
                            type='button'
                            size='sm'
                            variant='ghost'
                            disabled={isPending}
                            className='h-8 gap-1.5 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive'
                            onClick={() => handleDelete(player)}>
                            <Icon
                              name={deletingRegistrationId === player.registrationId ? 'spinner-ring' : 'trash-delete'}
                              className='size-3.5'
                            />
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 py-5 md:grid-cols-2 lg:grid-cols-3'>
                      <EditorField
                        id={`${idPrefix}-name`}
                        label='Player name'
                        name={`${prefix}.playerName`}
                        defaultValue={player.playerName}
                        maxLength={120}
                        autoComplete='name'
                        required
                      />
                      <EditorField
                        id={`${idPrefix}-email`}
                        label='Email'
                        name={`${prefix}.playerEmail`}
                        type='email'
                        defaultValue={player.playerEmail}
                        maxLength={320}
                        autoComplete='email'
                      />
                      <EditorField
                        id={`${idPrefix}-phone`}
                        label='Phone'
                        name={`${prefix}.playerPhone`}
                        type='tel'
                        defaultValue={player.playerPhone}
                        maxLength={64}
                        autoComplete='tel'
                      />
                      <EditorField
                        id={`${idPrefix}-handicap`}
                        label='Handicap index'
                        name={`${prefix}.handicapIndex`}
                        defaultValue={player.handicapIndex}
                        maxLength={64}
                      />
                      {/*<EditorField
                        id={`${idPrefix}-division`}
                        label='Division'
                        name={`${prefix}.division`}
                        defaultValue={player.division}
                        maxLength={120}
                        list='admin-registration-divisions'
                      />*/}
                      <EditorField
                        id={`${idPrefix}-shirt-size`}
                        label='Shirt size'
                        name={`${prefix}.shirtSize`}
                        defaultValue={player.shirtSize}
                        maxLength={64}
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className='rounded-xl border border-dashed border-border bg-muted/10 px-5 py-10 text-center'>
              <Icon name='person-multiple' className='mx-auto mb-3 size-8 text-muted-foreground/50' />
              <p className='font-okx text-sm'>No individual players registered yet.</p>
              <p className='mt-1 text-xs text-muted-foreground'>
                You can still correct the entry contact details above.
              </p>
            </div>
          )}
        </section>

        <div className='sticky bottom-3 z-10 bg-background/90 p-3 backdrop-blur-xl'>
          {state.status !== 'idle' ? (
            <p
              role={state.status === 'error' ? 'alert' : 'status'}
              className={cn(
                'mb-3 rounded-lg px-3 py-2 text-sm',
                state.status === 'error'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              )}>
              {state.message}
            </p>
          ) : null}
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button type='reset' variant='ghost' disabled={isPending} className='sm:min-w-28 font-poly'>
              Reset
            </Button>
            <Button
              type='submit'
              disabled={isPending || isAuthLoading || !user}
              className='font-poly text-white bg-foreground dark:text-background hover:bg-foreground/90 gap-2 sm:min-w-40'>
              {isSaving ? <Icon name='spinner-ring' className='size-4' /> : null}
              {isSaving ? 'Saving ...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </fieldset>
    </form>
  )
}

function EditorField({
  id,
  label,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  id: string
  label: string
}) {
  return (
    <div className='grid min-w-0 gap-2'>
      <Label htmlFor={id} className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>
        {label}
      </Label>
      <Input id={id} className={cn(inputClassName, className)} {...props} />
    </div>
  )
}
