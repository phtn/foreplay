'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Id } from '@/convex/_generated/dataModel'
import { useImageConverter } from '@/hooks/use-image-converter'
import { Icon } from '@/lib/icons'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { createTournamentEvent, generateEventAssetUploadUrl } from '../actions'

const imageAccept = 'image/png,image/jpeg,image/webp,image/avif'

type UploadConvertedImageOptions = {
  file: File | null
  convert: ReturnType<typeof useImageConverter>['convert']
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
  const [ticketLogoFile, setTicketLogoFile] = useState<File | null>(null)
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)
  const [published, setPublished] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { convert, terminate } = useImageConverter()

  useEffect(() => {
    return () => {
      terminate()
    }
  }, [terminate])

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
        divisions: (getOptionalFormValue(formData, 'divisions') ?? '')
          .split(',')
          .map((division) => division.trim())
          .filter(Boolean),
        description: getOptionalFormValue(formData, 'description'),
        ticketLogoStorageId,
        coverPhotoStorageId,
        published
      })

      formRef.current?.reset()
      setTicketLogoFile(null)
      setCoverPhotoFile(null)
      setPublished(true)
      setSuccessMessage('Event created.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'>
      <section className='rounded-lg border border-border/70 bg-card p-4 sm:p-5'>
        <p className='font-ios text-xs uppercase tracking-widest text-sky-500'>Create Event</p>
        <h2 className='mt-1 font-okx text-xl font-semibold'>Tournament setup</h2>
        <p className='mt-3 text-sm leading-6 text-muted-foreground'>
          Create the tournament record used by the public tournament page, entry flow, admin event list, pairings, and
          payment review screens.
        </p>

        <div className='mt-5 grid gap-3 text-sm'>
          <div className='rounded-lg border border-border/60 bg-muted/20 px-3 py-2'>
            <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>Slug</p>
            <p className='mt-1 text-foreground/85'>Used in URLs like /tournaments/som-2026.</p>
          </div>
          <div className='rounded-lg border border-border/60 bg-muted/20 px-3 py-2'>
            <p className='font-ios text-[10px] uppercase tracking-widest text-muted-foreground'>Images</p>
            <p className='mt-1 text-foreground/85'>Logo and cover photo uploads are converted to WebP before storage.</p>
          </div>
        </div>
      </section>

      <section className='rounded-lg border border-border/70 bg-card p-4 sm:p-5'>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='event-title'>Title</Label>
            <Input id='event-title' name='title' placeholder='Seoul of Manila Golf Tournament 2026' required />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='event-id'>Event slug</Label>
            <Input id='event-id' name='id' placeholder='som-2026' pattern='[a-z0-9]+(-[a-z0-9]+)*' required />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='event-venue'>Venue</Label>
            <Input id='event-venue' name='venue' placeholder='Pradera Verde Golf & Country Club, Pampanga' required />
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='event-date'>Date</Label>
              <Input id='event-date' name='date' type='date' required />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='event-time'>Gate open time</Label>
              <Input id='event-time' name='time' type='time' required />
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='event-registration-fee'>Registration fee</Label>
              <Input id='event-registration-fee' name='registrationFee' type='number' min='0' step='1' defaultValue='0' />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='event-slots-limit'>Slots limit</Label>
              <Input id='event-slots-limit' name='slotsLimit' type='number' min='1' step='1' placeholder='120' />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='event-divisions'>Divisions</Label>
            <Input id='event-divisions' name='divisions' placeholder='Open, Senior, Ladies' />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='event-description'>Description</Label>
            <textarea
              id='event-description'
              name='description'
              placeholder='Short event description'
              className='min-h-28 w-full resize-y rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
            />
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='event-ticket-logo'>Logo</Label>
              <Input
                id='event-ticket-logo'
                type='file'
                accept={imageAccept}
                onChange={(event) => setTicketLogoFile(event.currentTarget.files?.[0] ?? null)}
                className='h-11 file:mr-3'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='event-cover-photo'>Cover photo</Label>
              <Input
                id='event-cover-photo'
                type='file'
                accept={imageAccept}
                onChange={(event) => setCoverPhotoFile(event.currentTarget.files?.[0] ?? null)}
                className='h-11 file:mr-3'
              />
            </div>
          </div>

          <div className='flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-3'>
            <div>
              <Label htmlFor='event-published'>Published</Label>
              <p className='mt-1 text-xs text-muted-foreground'>Show this event in public tournament surfaces.</p>
            </div>
            <Switch id='event-published' checked={published} onCheckedChange={setPublished} />
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
      </section>
    </form>
  )
}
