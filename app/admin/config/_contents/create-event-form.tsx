'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Id } from '@/convex/_generated/dataModel'
import { useImageConverter } from '@/hooks/use-image-converter'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { createTournamentEvent, generateEventAssetUploadUrl } from '../actions'

const imageAccept = 'image/png,image/jpeg,image/webp,image/avif'

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0
})

const datePreviewFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
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

  const timestamp = new Date(`${date}T${time || '00:00'}:00`).getTime()

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

export function CreateEventForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const logoPreviewUrlRef = useRef<string | null>(null)
  const coverPreviewUrlRef = useRef<string | null>(null)
  const [draft, setDraft] = useState<EventDraft>(emptyDraft)
  const [ticketLogoFile, setTicketLogoFile] = useState<File | null>(null)
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [published, setPublished] = useState(true)
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
      previewUrlRef: React.MutableRefObject<string | null>
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
    setDraft(emptyDraft)
    setTicketLogoFile(null)
    setCoverPhotoFile(null)
    setLogoPreviewUrl(null)
    setCoverPreviewUrl(null)
    setPublished(true)

    if (logoPreviewUrlRef.current) {
      URL.revokeObjectURL(logoPreviewUrlRef.current)
      logoPreviewUrlRef.current = null
    }

    if (coverPreviewUrlRef.current) {
      URL.revokeObjectURL(coverPreviewUrlRef.current)
      coverPreviewUrlRef.current = null
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const [ticketLogoStorageId, coverPhotoStorageId] = await Promise.all([
        uploadConvertedImage({ file: ticketLogoFile, convert }),
        uploadConvertedImage({ file: coverPhotoFile, convert })
      ])

      await createTournamentEvent({
        id: getRequiredFormValue(formData, 'id'),
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
      })

      resetForm()
      setSuccessMessage('Event created.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='grid gap-5 xl:grid-cols-[minmax(360px,0.82fr)_1.18fr]'>
      <section className='grid content-start gap-4'>
        <div className='overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm'>
          <div className='relative min-h-72 bg-neutral-950'>
            {coverPreviewUrl ? (
              <Image src={coverPreviewUrl} alt='' fill unoptimized className='object-cover opacity-85' sizes='520px' />
            ) : (
              <div className='absolute inset-0 bg-[linear-gradient(135deg,#111827,#14532d_52%,#0e7490)]' />
            )}
            <div className='absolute inset-0 bg-black/28' />
            <div className='relative flex min-h-72 flex-col justify-between p-5 text-white'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='relative flex size-14 items-center justify-center overflow-hidden rounded-lg border border-white/25 bg-white/15'>
                    {logoPreviewUrl ? (
                      <Image src={logoPreviewUrl} alt='' fill unoptimized className='object-contain p-1.5' sizes='56px' />
                    ) : (
                      <span className='font-okx text-xl'>{previewTitle.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className='font-ios text-[10px] uppercase tracking-widest text-white/65'>
                      {published ? 'Published' : 'Draft'}
                    </p>
                    <p className='mt-1 font-mono text-xs text-white/80'>/{previewSlug}</p>
                  </div>
                </div>
                <span className='rounded-full bg-white/15 px-3 py-1 font-ios text-[10px] uppercase tracking-widest text-white/80'>
                  {previewFee}
                </span>
              </div>

              <div className='max-w-md'>
                <h2 className='font-okx text-3xl font-semibold leading-tight'>{previewTitle}</h2>
                <p className='mt-3 text-sm leading-6 text-white/78'>{draft.description || previewVenue}</p>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-3 divide-x divide-border/60 border-t border-border/70 bg-card'>
            <PreviewMetric label='When' value={previewDate} />
            <PreviewMetric label='Field' value={draft.slotsLimit ? `${draft.slotsLimit} slots` : 'Open'} />
            <PreviewMetric label='Where' value={previewVenue} />
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
              <p className='font-ios text-xs uppercase tracking-widest text-sky-600'>Create event</p>
              <h2 className='mt-1 font-okx text-xl font-semibold'>Tournament setup</h2>
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
                required
              />
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
                previewUrl={logoPreviewUrl}
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
                previewUrl={coverPreviewUrl}
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
            <Button type='button' variant='outline' className='h-11 justify-center' disabled={isSubmitting} onClick={resetForm}>
              Reset
            </Button>
            <Button type='submit' className='h-11 justify-center' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon name='spinner-ring' className='size-4' />
                  <span>Creating</span>
                </>
              ) : (
                <>
                  <Icon name='add' className='size-4' />
                  <span>Create event</span>
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
      <Input id={id} value={value} onChange={(event) => onChange(event.currentTarget.value)} className='h-11' {...props} />
    </div>
  )
}

function EventFileInput({
  file,
  id,
  label,
  onChange,
  previewUrl
}: {
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
            <span className='font-okx text-sm'>{file?.name ?? 'Select image'}</span>
          </span>
        )}
        {previewUrl ? (
          <span className='absolute inset-x-3 bottom-3 truncate rounded-md bg-background/90 px-2 py-1 text-xs shadow-sm'>
            {file?.name ?? 'Selected image'}
          </span>
        ) : null}
      </label>
      <input id={id} type='file' accept={imageAccept} onChange={onChange} className='sr-only' />
    </div>
  )
}
