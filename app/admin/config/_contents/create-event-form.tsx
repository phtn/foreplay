'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useImageConverter } from '@/hooks/use-image-converter'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { type ChangeEvent, RefObject, SubmitEvent, useEffect, useMemo, useRef, useState } from 'react'
import { createTournamentEvent, generateEventAssetUploadUrl, updateTournamentEvent } from '../actions'

const imageAccept = 'image/png,image/jpeg,image/webp,image/avif'

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
})

const datePreviewFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila'
})

type UploadConvertedImageOptions = {
  file: File | null
  convert: ReturnType<typeof useImageConverter>['convert']
}

type EventDraft = {
  title: string
  id: string
  venue: string
  date: string
  time: string
  registrationFee: string
  slotsLimit: string
  divisions: string
  description: string
}

export type EditableEvent = Pick<
  Doc<'tournaments'>,
  | '_id'
  | 'title'
  | 'venue'
  | 'gate_open_at'
  | 'registration_fee'
  | 'slots_limit'
  | 'divisions'
  | 'description'
  | 'published'
  | 'ticket_logo_url'
  | 'cover_photo_url'
> & { id: string }

type EventFormProps = {
  event?: EditableEvent
  initialCoverUrl?: string | null
  initialLogoUrl?: string | null
}

const emptyDraft: EventDraft = {
  title: '',
  id: '',
  venue: '',
  date: '',
  time: '',
  registrationFee: '0',
  slotsLimit: '',
  divisions: '',
  description: ''
}

function getEventDraft(event: EditableEvent): EventDraft {
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(event.gate_open_at)
      .map(({ type, value }) => [type, value])
  )

  return {
    title: event.title,
    id: event.id,
    venue: event.venue,
    date: `${dateParts.year}-${dateParts.month}-${dateParts.day}`,
    time: `${dateParts.hour}:${dateParts.minute}`,
    registrationFee: String(event.registration_fee),
    slotsLimit: event.slots_limit === undefined ? '' : String(event.slots_limit),
    divisions: event.divisions?.join(', ') ?? '',
    description: event.description ?? ''
  }
}

function getRequiredFormValue(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} is required.`)
  }

  return value.trim()
}

function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getOptionalFormNumber(formData: FormData, key: string) {
  const value = getOptionalFormValue(formData, key)

  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a valid number.`)
  }

  return parsed
}

function getDivisions(value: string) {
  return value
    .split(',')
    .map((division) => division.trim())
    .filter(Boolean)
}

function formatPreviewDate(date: string, time: string) {
  if (!date) {
    return 'Date pending'
  }

  const timestamp = new Date(`${date}T${time || '00:00'}:00+08:00`).getTime()

  if (!Number.isFinite(timestamp)) {
    return 'Date pending'
  }

  return time ? `${datePreviewFormatter.format(timestamp)} at ${time}` : datePreviewFormatter.format(timestamp)
}

function formatPreviewFee(value: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Sponsor-driven'
  }

  return pesoFormatter.format(parsed)
}

async function uploadConvertedImage({ file, convert }: UploadConvertedImageOptions) {
  if (!file) {
    return undefined
  }

  const convertedImage = await convert(file, { format: 'webp', quality: 0.82 })
  const uploadUrl = await generateEventAssetUploadUrl()
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': convertedImage.format || 'image/webp'
    },
    body: convertedImage.blob
  })

  if (!uploadResponse.ok) {
    throw new Error(`Unable to upload ${file.name}.`)
  }

  const uploadResult = (await uploadResponse.json()) as { storageId: Id<'_storage'> }
  return uploadResult.storageId
}

export function CreateEventForm({ event, initialCoverUrl, initialLogoUrl }: EventFormProps) {
  const router = useRouter()
  const { user } = useFirebaseUser()
  const formRef = useRef<HTMLFormElement>(null)
  const logoPreviewUrlRef = useRef<string | null>(null)
  const coverPreviewUrlRef = useRef<string | null>(null)
  const [draft, setDraft] = useState<EventDraft>(() => (event ? getEventDraft(event) : emptyDraft))
  const [ticketLogoFile, setTicketLogoFile] = useState<File | null>(null)
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [published, setPublished] = useState(event ? event.published !== false : false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { convert, terminate } = useImageConverter()

  const divisions = useMemo(() => getDivisions(draft.divisions), [draft.divisions])
  const previewTitle = draft.title || 'Tournament title'
  const previewSlug = draft.id || 'event-slug'
  const previewVenue = draft.venue || 'Venue'
  const previewDate = formatPreviewDate(draft.date, draft.time)
  const previewFee = formatPreviewFee(draft.registrationFee)
  const isEditing = Boolean(event)

  useEffect(() => {
    return () => {
      if (logoPreviewUrlRef.current) {
        URL.revokeObjectURL(logoPreviewUrlRef.current)
      }

      if (coverPreviewUrlRef.current) {
        URL.revokeObjectURL(coverPreviewUrlRef.current)
      }

      terminate()
    }
  }, [terminate])

  const updateDraft = <Key extends keyof EventDraft>(key: Key, value: EventDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>,
    options: {
      setFile: (file: File | null) => void
      setPreviewUrl: (url: string | null) => void
      previewUrlRef: RefObject<string | null>
    }
  ) => {
    if (options.previewUrlRef.current) {
      URL.revokeObjectURL(options.previewUrlRef.current)
      options.previewUrlRef.current = null
    }

    const file = event.currentTarget.files?.[0] ?? null
    options.setFile(file)

    if (!file) {
      options.setPreviewUrl(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    options.previewUrlRef.current = nextPreviewUrl
    options.setPreviewUrl(nextPreviewUrl)
  }

  const resetForm = () => {
    formRef.current?.reset()
    setDraft(event ? getEventDraft(event) : emptyDraft)
    setTicketLogoFile(null)
    setCoverPhotoFile(null)
    setLogoPreviewUrl(null)
    setCoverPreviewUrl(null)
    setPublished(event ? event.published !== false : true)

    if (logoPreviewUrlRef.current) {
      URL.revokeObjectURL(logoPreviewUrlRef.current)
      logoPreviewUrlRef.current = null
    }

    if (coverPreviewUrlRef.current) {
      URL.revokeObjectURL(coverPreviewUrlRef.current)
      coverPreviewUrlRef.current = null
    }
  }

  const handleSubmit = async (submitEvent: SubmitEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(submitEvent.currentTarget)
      const [ticketLogoStorageId, coverPhotoStorageId] = await Promise.all([
        uploadConvertedImage({ file: ticketLogoFile, convert }),
        uploadConvertedImage({ file: coverPhotoFile, convert })
      ])

      const eventInput = {
        title: getRequiredFormValue(formData, 'title'),
        venue: getRequiredFormValue(formData, 'venue'),
        date: getRequiredFormValue(formData, 'date'),
        time: getRequiredFormValue(formData, 'time'),
        registrationFee: getOptionalFormNumber(formData, 'registrationFee') ?? 0,
        slotsLimit: getOptionalFormNumber(formData, 'slotsLimit'),
        divisions: getDivisions(getOptionalFormValue(formData, 'divisions') ?? ''),
        description: getOptionalFormValue(formData, 'description'),
        ticketLogoStorageId,
        coverPhotoStorageId,
        published
      }

      if (event) {
        if (!user) throw new Error('Your admin session is still loading. Try again in a moment.')
        const firebaseIdToken = await user.getIdToken(true)
        await updateTournamentEvent({ tournamentId: event._id, ...eventInput }, firebaseIdToken)
        router.push(`/admin/${encodeURIComponent(event.id)}`)
      } else {
        await createTournamentEvent({ id: getRequiredFormValue(formData, 'id'), ...eventInput })
        resetForm()
        setSuccessMessage('Event created.')
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? 'Size limit exceeded.'
          : `Unable to ${isEditing ? 'update' : 'create'} event.`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='grid gap-5 xl:grid-cols-[minmax(360px,0.82fr)_1.18fr]'>
      <section className='grid content-start gap-4'>
        <div className='overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm'>
          <div className='relative min-h-72 bg-neutral-800'>
            {coverPreviewUrl || initialCoverUrl ? (
              <Image
                src={coverPreviewUrl ?? initialCoverUrl!}
                alt=''
                fill
                unoptimized
                className='object-cover opacity-25'
                sizes='520px'
              />
            ) : (
              <div className='absolute inset-0 bg-[#c0c0c0]/70' />
            )}
            <div className='absolute inset-0 bg-black/28' />
            <div className='relative flex min-h-72 flex-col justify-between p-5 text-white'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='relative flex size-14 items-center justify-center overflow-hidden rounded-lg border border-white/25 bg-white'>
                    {logoPreviewUrl || initialLogoUrl ? (
                      <Image
                        src={logoPreviewUrl ?? initialLogoUrl!}
                        alt=''
                        fill
                        unoptimized
                        className='object-contain p-1.5'
                        sizes='56px'
                      />
                    ) : (
                      <span className='font-poly text-2xl'>{previewTitle.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className='font-ios text-xs uppercase tracking-widest text-white'>
                      {published ? 'Published' : 'Draft'}
                    </p>
                    <p className='mt-1 font-ios text-xs text-white'>/{previewSlug}</p>
                  </div>
                </div>
                <span className='rounded-full bg-white/15 px-3 py-1 font-ios text-[10px] uppercase tracking-widest text-white'>
                  {previewFee}
                </span>
              </div>

              <div className='max-w-md'>
                <h2 className='font-poly font-medium text-lg md:text-2xl leading-tight capitalize'>{previewTitle}</h2>
                <p className='mt-3 text-sm leading-6 text-white/78'>{draft.description || previewVenue}</p>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 divide-x divide-border/60 border-t border-border/70 bg-card'>
            <PreviewMetric label='When' value={previewDate} />
            <PreviewMetric label='Field' value={draft.slotsLimit ? `${draft.slotsLimit} slots` : 'Open'} />
          </div>
        </div>

        <div className='rounded-xl border border-border/70 bg-card p-4 shadow-sm'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='font-ios text-xs uppercase tracking-widest text-sky-600'>Divisions</p>
              <p className='mt-1 font-okx text-sm text-foreground/85'>{divisions.length || 0} configured</p>
            </div>
            <div className='flex max-w-[65%] flex-wrap justify-end gap-1.5'>
              {divisions.length ? (
                divisions.map((division) => (
                  <span key={division} className='rounded-full border border-border/70 px-2.5 py-1 text-xs'>
                    {division}
                  </span>
                ))
              ) : (
                <span className='rounded-full border border-dashed border-border/70 px-2.5 py-1 text-xs text-muted-foreground'>
                  Unassigned
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className='rounded-xl border border-border/70 bg-card shadow-sm'>
        <div className='border-b border-border/70 p-4 sm:p-5'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <p className='font-ios text-xs uppercase tracking-widest text-sky-600'>
                {isEditing ? 'Edit event' : 'Create event'}
              </p>
              <h2 className='mt-1 font-okx text-xl font-semibold'>Tournament Setup</h2>
            </div>
            <div className='flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2'>
              <div>
                <Label htmlFor='event-published'>Published</Label>
                <p className='mt-0.5 text-xs text-muted-foreground'>Public listing</p>
              </div>
              <Switch id='event-published' checked={published} onCheckedChange={setPublished} />
            </div>
          </div>
        </div>

        <div className='grid gap-6 p-4 sm:p-5'>
          <FieldSet title='Identity'>
            <div className='grid gap-4 md:grid-cols-[1.25fr_0.75fr]'>
              <EventInput
                id='event-title'
                label='Title'
                name='title'
                value={draft.title}
                onChange={(value) => updateDraft('title', value)}
                placeholder='Seoul of Manila Golf Tournament 2026'
                required
              />
              <EventInput
                id='event-id'
                label='Event slug'
                name='id'
                value={draft.id}
                onChange={(value) => updateDraft('id', value.toLowerCase())}
                placeholder='som-2026'
                pattern='[a-z0-9]+(-[a-z0-9]+)*'
                readOnly={isEditing}
                required
              />
              {isEditing ? (
                <p className='text-xs text-muted-foreground md:col-start-2'>Event slugs stay fixed after creation.</p>
              ) : null}
            </div>
            <EventInput
              id='event-venue'
              label='Venue'
              name='venue'
              value={draft.venue}
              onChange={(value) => updateDraft('venue', value)}
              placeholder='Pradera Verde Golf & Country Club, Pampanga'
              required
            />
          </FieldSet>

          <FieldSet title='Schedule and Capacity'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <EventInput
                id='event-date'
                label='Date'
                name='date'
                type='date'
                value={draft.date}
                onChange={(value) => updateDraft('date', value)}
                required
              />
              <EventInput
                id='event-time'
                label='Gate open time'
                name='time'
                type='time'
                value={draft.time}
                onChange={(value) => updateDraft('time', value)}
                required
              />
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <EventInput
                id='event-registration-fee'
                label='Registration fee'
                name='registrationFee'
                type='number'
                min='0'
                step='1'
                value={draft.registrationFee}
                onChange={(value) => updateDraft('registrationFee', value)}
              />
              <EventInput
                id='event-slots-limit'
                label='Slots limit'
                name='slotsLimit'
                type='number'
                min='1'
                step='1'
                value={draft.slotsLimit}
                onChange={(value) => updateDraft('slotsLimit', value)}
                placeholder='120'
              />
            </div>
          </FieldSet>

          <FieldSet title='Program'>
            <EventInput
              id='event-divisions'
              label='Divisions'
              name='divisions'
              value={draft.divisions}
              onChange={(value) => updateDraft('divisions', value)}
              placeholder='Open, Senior, Ladies'
            />
            <div className='grid gap-2'>
              <Label htmlFor='event-description'>Description</Label>
              <textarea
                id='event-description'
                name='description'
                value={draft.description}
                onChange={(event) => updateDraft('description', event.currentTarget.value)}
                placeholder='Short event description'
                className='min-h-28 w-full resize-y rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
              />
            </div>
          </FieldSet>

          <FieldSet title='Assets'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <EventFileInput
                id='event-ticket-logo'
                label='Logo'
                file={ticketLogoFile}
                previewUrl={logoPreviewUrl ?? initialLogoUrl ?? null}
                existingSaved={Boolean(event?.ticket_logo_url)}
                onChange={(event) =>
                  handleImageChange(event, {
                    setFile: setTicketLogoFile,
                    setPreviewUrl: setLogoPreviewUrl,
                    previewUrlRef: logoPreviewUrlRef
                  })
                }
              />
              <EventFileInput
                id='event-cover-photo'
                label='Cover photo'
                file={coverPhotoFile}
                previewUrl={coverPreviewUrl ?? initialCoverUrl ?? null}
                existingSaved={Boolean(event?.cover_photo_url)}
                onChange={(event) =>
                  handleImageChange(event, {
                    setFile: setCoverPhotoFile,
                    setPreviewUrl: setCoverPreviewUrl,
                    previewUrlRef: coverPreviewUrlRef
                  })
                }
              />
            </div>
          </FieldSet>

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

          <div className='flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-end'>
            <Button
              type='button'
              variant='outline'
              className='h-11 justify-center'
              disabled={isSubmitting}
              onClick={resetForm}>
              {isEditing ? 'Revert changes' : 'Reset'}
            </Button>
            <Button type='submit' className='h-11 justify-center' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon name='spinner-ring' className='size-4' />
                  <span>{isEditing ? 'Saving' : 'Creating'}</span>
                </>
              ) : (
                <>
                  {!isEditing ? <Icon name='add' className='size-4' /> : null}
                  <span>{isEditing ? 'Save changes' : 'Create event'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </form>
  )
}

function FieldSet({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <fieldset className='grid gap-4'>
      <legend className='mb-3 font-ios text-xs uppercase tracking-widest text-muted-foreground'>{title}</legend>
      {children}
    </fieldset>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className='min-w-0 px-3 py-3'>
      <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>{label}</p>
      <p className='mt-1 truncate font-okx text-sm text-foreground/85'>{value}</p>
    </div>
  )
}

function EventInput({
  id,
  label,
  onChange,
  value,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> & {
  id: string
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className='h-11'
        {...props}
      />
    </div>
  )
}

function EventFileInput({
  existingSaved,
  file,
  id,
  label,
  onChange,
  previewUrl
}: {
  existingSaved?: boolean
  file: File | null
  id: string
  label: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  previewUrl: string | null
}) {
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className={cn(
          'relative flex min-h-36 cursor-pointer overflow-hidden rounded-lg border border-dashed border-border/80 bg-muted/10 transition-colors hover:border-sky-500/60',
          previewUrl && 'border-solid bg-background'
        )}>
        {previewUrl ? (
          <Image src={previewUrl} alt='' fill unoptimized className='object-cover' sizes='360px' />
        ) : (
          <span className='flex w-full flex-col items-center justify-center gap-2 p-5 text-center text-muted-foreground'>
            <Icon name='file' className='size-7' />
            <span className='font-okx text-sm'>
              {file?.name ?? (existingSaved ? 'Choose replacement image' : 'Select image')}
            </span>
          </span>
        )}
        {previewUrl ? (
          <span className='absolute inset-x-3 bottom-3 truncate rounded-md bg-background/90 px-2 py-1 text-xs shadow-sm'>
            {file?.name ?? (existingSaved ? 'Current image' : 'Selected image')}
          </span>
        ) : null}
      </label>
      <input id={id} type='file' accept={imageAccept} onChange={onChange} className='sr-only' />
    </div>
  )
}
