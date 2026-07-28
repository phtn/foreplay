'use client'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { type SubmitEvent, useRef, useState } from 'react'
import { saveTournamentSponsorList } from './actions'

type TournamentSponsorList = NonNullable<Doc<'tournaments'>['sponsor_list']>
type TournamentSponsor = TournamentSponsorList[number]

type SponsorDraft = {
  key: string
  value: string
  label: string
  url: string
  isActive: boolean
}

interface EventSponsorsDrawerProps {
  eventTitle: string
  sponsorList: Doc<'tournaments'>['sponsor_list']
  tournamentId: Id<'tournaments'>
}

function getSponsorDraft(sponsor: TournamentSponsor, index: number): SponsorDraft {
  return {
    key: `sponsor-${index}`,
    value: sponsor.value,
    label: sponsor.label ?? '',
    url: sponsor.url ?? '',
    isActive: sponsor.is_active !== false
  }
}

function getSponsorDrafts(sponsorList: TournamentSponsorList | undefined): SponsorDraft[] {
  return sponsorList?.map(getSponsorDraft) ?? []
}

export function EventSponsorsDrawer({ eventTitle, sponsorList, tournamentId }: EventSponsorsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState<SponsorDraft[]>(() => getSponsorDrafts(sponsorList))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nextSponsorKey = useRef(sponsorList?.length ?? 0)
  const configured = Boolean(sponsorList?.length)

  const clearMessages = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDrafts(getSponsorDrafts(sponsorList))
      nextSponsorKey.current = sponsorList?.length ?? 0
      clearMessages()
    }

    setOpen(nextOpen)
  }

  const addSponsor = () => {
    const key = `sponsor-${nextSponsorKey.current}`
    nextSponsorKey.current += 1
    setDrafts((current) => [
      ...current,
      {
        key,
        value: '',
        label: '',
        url: '',
        isActive: true
      }
    ])
    clearMessages()
  }

  const updateSponsor = <Key extends keyof Omit<SponsorDraft, 'key'>>(
    sponsorKey: string,
    field: Key,
    value: SponsorDraft[Key]
  ) => {
    setDrafts((current) =>
      current.map((sponsor) => (sponsor.key === sponsorKey ? { ...sponsor, [field]: value } : sponsor))
    )
    clearMessages()
  }

  const removeSponsor = (sponsorKey: string) => {
    setDrafts((current) => current.filter((sponsor) => sponsor.key !== sponsorKey))
    clearMessages()
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const result = await saveTournamentSponsorList({
        tournamentId,
        sponsorList: drafts.map(({ value, label, url, isActive }) => ({
          value,
          label,
          url,
          is_active: isActive
        }))
      })

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      setSuccessMessage(drafts.length ? 'Sponsor list saved.' : 'Sponsor list cleared.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save the sponsor list.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection='right'>
      <Tooltip>
        <TooltipTrigger
          delay={150}
          render={
            <DrawerTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  className='relative rounded-full text-sky-600 hover:text-sky-500'
                  aria-label={`${configured ? 'Edit' : 'Add'} sponsors for ${eventTitle}`}>
                  <Icon name='heart-hand' className='size-5' />
                  {configured ? (
                    <span
                      aria-hidden
                      className='absolute right-0.5 top-0.5 size-1.5 rounded-full bg-emerald-500 ring-2 ring-background'
                    />
                  ) : null}
                </Button>
              }
            />
          }
        />
        <TooltipContent side='top'>{configured ? 'Edit sponsors' : 'Add sponsors'}</TooltipContent>
      </Tooltip>

      <DrawerContent className='[--drawer-content-width:calc(100vw-1rem)] sm:[--drawer-content-width:46rem] rounded-lg'>
        <DrawerHeader className='flex-row items-start justify-between gap-4 border-b border-border/60 border-dashed pb-4 text-left'>
          <div className='min-w-0 space-y-1'>
            <p className='font-ios text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400'>
              Tournament sponsors
            </p>
            <DrawerTitle className='truncate font-poly text-xl'>{eventTitle}</DrawerTitle>
            <DrawerDescription className='font-ios text-xs whitespace-nowrap'>
              {drafts.length
                ? `${drafts.length} sponsor${drafts.length === 1 ? '' : 's'} in this list`
                : 'Build the sponsor list for this tournament'}
            </DrawerDescription>
          </div>

          <DrawerClose
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                className='shrink-0 rounded-full'
                disabled={isSubmitting}
                aria-label='Close tournament sponsors'>
                <Icon name='close' className='size-4' />
              </Button>
            }
          />
        </DrawerHeader>

        <form onSubmit={handleSubmit} className='flex min-h-0 flex-1 flex-col'>
          <div className='min-h-0 flex-1 overflow-y-auto bg-slate-950/5 p-0'>
            <div className='grid gap-4'>
              {drafts.length ? (
                drafts.map((sponsor, index) => (
                  <SponsorEditor
                    key={sponsor.key}
                    index={index}
                    sponsor={sponsor}
                    onRemove={() => removeSponsor(sponsor.key)}
                    onChange={(field, value) => updateSponsor(sponsor.key, field, value)}
                  />
                ))
              ) : (
                <div className='flex min-h-48 flex-col items-center justify-center gap-3 bg-background p-8 text-center'>
                  <Icon name='heart-hand' className='size-9 text-muted-foreground/60' />
                  <div>
                    <p className='font-okx text-base'>No sponsors yet</p>
                    <p className='mt-1 text-sm text-muted-foreground'>Add the first sponsor to this tournament.</p>
                  </div>
                  <Button type='button' variant='outline' onClick={addSponsor}>
                    <Icon name='add' className='size-4' />
                    Add sponsor
                  </Button>
                </div>
              )}

              <div className='p-4 space-y-4'>
                {drafts.length ? (
                  <Button
                    type='button'
                    variant='outline'
                    className='h-11 border-dashed w-full bg-background'
                    onClick={addSponsor}>
                    <Icon name='add' className='size-4' />
                    Add another sponsor
                  </Button>
                ) : null}

                <ul className='list-disc px-5'>
                  <li className='text-xs leading-5 text-muted-foreground'>Sponsor is required.</li>
                  <li className='text-xs leading-5 text-muted-foreground'>Title/Label and Link URL are optional. </li>
                  <li className='text-xs leading-5 text-muted-foreground'>
                    Remove every row and save to clear the list.
                  </li>
                </ul>
                {errorMessage ? (
                  <p role='alert' className='rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                    {errorMessage}
                  </p>
                ) : null}

                {successMessage ? (
                  <p
                    role='status'
                    className='rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'>
                    {successMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <DrawerFooter className='grid border-t border-border/70 p-4'>
            {/*<DrawerClose
              render={
                <Button type='button' variant='ghost' className='h-12 font-poly' disabled={isSubmitting}>
                  Close
                </Button>
              }
            />*/}
            <Button
              type='submit'
              className='h-12 gap-2 bg-foreground hover:bg-foreground/80 font-poly text-background'
              disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span>Saving</span>
                  <Icon name='spinner-ring' className='size-3.5' />
                </>
              ) : (
                <span>Save</span>
              )}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

function SponsorEditor({
  index,
  onChange,
  onRemove,
  sponsor
}: {
  index: number
  onChange: <Key extends keyof Omit<SponsorDraft, 'key'>>(field: Key, value: SponsorDraft[Key]) => void
  onRemove: () => void
  sponsor: SponsorDraft
}) {
  const fieldId = `event-sponsor-${sponsor.key}`

  return (
    <fieldset className='grid gap-4 bg-background p-4 shadow-sm'>
      <legend className='sr-only'>Sponsor {index + 1}</legend>

      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='font-okx font-medium text-xs uppercase tracking-widest'>Sponsor {index + 1}</p>
          <p className='mt-1 text-xs text-muted-foreground tracking-widest'>
            {sponsor.isActive ? 'Visible' : 'Hidden'}
          </p>
        </div>
        <div className='flex items-center space-x-3'>
          <div className='flex items-center gap-2 rounded-lg _border border-border/60 bg-muted/20 px-1 py-1'>
            <div>
              <Label className='text-xs' htmlFor={`${fieldId}-active`}>
                Active
              </Label>
              {/*<p className='mt-1 text-xs text-muted-foreground'>Keep the entry without showing it publicly.</p>*/}
            </div>
            <Switch
              size='sm'
              id={`${fieldId}-active`}
              checked={sponsor.isActive}
              onCheckedChange={(value) => onChange('isActive', value)}
            />
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            className='rounded-full hover:text-destructive opacity-60 hover:opacity-100'
            onClick={onRemove}
            aria-label={`Remove sponsor ${index + 1}`}>
            <Icon name='trash-delete' className='size-4' />
          </Button>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <SponsorInput
          id={`${fieldId}-value`}
          label='Sponsor'
          value={sponsor.value}
          onChange={(value) => onChange('value', value)}
          placeholder='sponsor'
          maxLength={160}
          required
        />
        <SponsorInput
          id={`${fieldId}-label`}
          label='Title/Label'
          value={sponsor.label}
          onChange={(value) => onChange('label', value)}
          placeholder='Sponsor Golf'
          maxLength={160}
        />
      </div>

      <SponsorInput
        id={`${fieldId}-url`}
        label='Link URL'
        type='url'
        value={sponsor.url}
        onChange={(value) => onChange('url', value)}
        placeholder='https://example.com'
        maxLength={2048}
      />
    </fieldset>
  )
}

function SponsorInput({
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
      <Label className='text-xs' htmlFor={id}>
        {label}
      </Label>
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
